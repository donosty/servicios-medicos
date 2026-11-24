(function () {
  "use strict";

  const form = document.getElementById("forgot-password-form");
  const message = document.getElementById("forgot-password-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    message.textContent =
      "Si existe una cuenta con este correo, se te enviará un enlace para restablecer la contraseña.";

    try {
      await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.elements.email.value }),
      });
    } catch (_error) {
      // La interfaz conserva la respuesta genérica aunque falle la solicitud.
    } finally {
      submit.disabled = false;
      window.setTimeout(() => {
        window.location.replace("/login.html");
      }, 5000);
    }
  });
})();
