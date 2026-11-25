(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const token = hashParams.get("token") || "";
  const message = document.getElementById("confirm-email-message");
  const confirmationEmailKey = "medicom.emailConfirmationEmail";
  const confirmationForm = document.getElementById("confirm-email-form");
  const resendForm = document.getElementById("resend-confirmation-form");
  const loginLinks = document.getElementById("confirm-email-links");
  const emailDisplay = document.getElementById("confirmation-email");
  const emailStorageFailed = params.get("emailStored") === "false";
  let storedEmail = "";
  let storageAvailable = true;

  if (!emailStorageFailed) {
    try {
      storedEmail = window.localStorage.getItem(confirmationEmailKey) || "";
    } catch {
      storageAvailable = false;
    }
  }

  const unavailableEmailMessage = emailStorageFailed || !storageAvailable
    ? " No fue posible guardar el correo para reenviar el enlace."
    : " No hay un correo guardado para reenviar el enlace.";
  const showResendOption = () => {
    resendForm.hidden = !storedEmail;
    emailDisplay.hidden = !storedEmail;
    if (storedEmail) emailDisplay.textContent = `Correo: ${storedEmail}`;
  };

  if (token) {
    confirmationForm.hidden = false;
    resendForm.hidden = true;
    message.textContent =
      "Pulsa el botón para confirmar tu correo y activar tu cuenta.";
  } else if (params.get("emailSent") === "true") {
    showResendOption();
    message.textContent =
      "Tu cuenta fue creada. Revisa tu correo y abre el enlace para confirmarla.";
    if (!storedEmail) {
      message.textContent += unavailableEmailMessage;
    }
  } else if (params.get("emailSent") === "false") {
    showResendOption();
    message.textContent =
      "Tu cuenta fue creada, pero no se pudo enviar el correo. Puedes solicitar otro enlace.";
    if (!storedEmail) {
      message.textContent += unavailableEmailMessage;
    }
  } else if (params.get("confirmed") === "true") {
    loginLinks.hidden = false;
    message.textContent =
      "Tu correo ya está confirmado. Puedes iniciar sesión.";
  } else {
    showResendOption();
    message.textContent = storedEmail
      ? "Usa el enlace recibido o solicita uno nuevo."
      : "Usa el enlace de confirmación recibido por correo.";
  }

  confirmationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = confirmationForm.querySelector("button[type='submit']");
    submit.disabled = true;
    message.textContent = "";
    let confirmed = false;

    try {
      const response = await fetch("/api/auth/email-confirmation/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      confirmed = true;
      submit.textContent = "Correo confirmado";
      resendForm.hidden = true;
      loginLinks.hidden = false;
      message.textContent = data.message;
      let emailRemoved = true;
      try {
        window.localStorage.removeItem(confirmationEmailKey);
      } catch {
        emailRemoved = false;
      }
      if (emailRemoved) {
        emailDisplay.hidden = true;
        emailDisplay.textContent = "";
      } else {
        message.textContent +=
          " No fue posible borrar el correo guardado en este navegador.";
      }
      window.history.replaceState(
        null,
        "",
        "/confirm-email.html?confirmed=true",
      );
    } catch (error) {
      showResendOption();
      message.textContent =
        error.message || "No fue posible confirmar el correo.";
    } finally {
      submit.disabled = confirmed;
    }
  });

  resendForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = resendForm.querySelector("button[type='submit']");
    submit.disabled = true;
    message.textContent = "";

    try {
      const email = window.localStorage.getItem(confirmationEmailKey);
      if (!email) {
        showResendOption();
        message.textContent = "No hay un correo guardado para reenviar el enlace.";
        return;
      }
      const response = await fetch("/api/auth/email-confirmation/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      message.textContent = data.message;
    } catch (_error) {
      message.textContent =
        "No fue posible leer el correo guardado o conectar con el servidor.";
    } finally {
      submit.disabled = false;
    }
  });
})();
