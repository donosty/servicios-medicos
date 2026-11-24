(function () {
  "use strict";

  const token = new URLSearchParams(window.location.search).get("token") || "";
  const form = document.getElementById("reset-password-form");
  const message = document.getElementById("reset-password-message");
  let passwordUpdated = false;

  async function cancelReset() {
    if (!token || passwordUpdated) return;
    try {
      await fetch("/api/auth/password-reset/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        keepalive: true,
        body: JSON.stringify({ token }),
      });
    } catch (_error) {}
  }

  window.addEventListener("pagehide", cancelReset);
  window.addEventListener("beforeunload", cancelReset);

  async function validateReset() {
    if (!token) {
      message.textContent = "El enlace de restablecimiento no es válido.";
      return;
    }
    try {
      const response = await fetch(
        `/api/auth/password-reset/validate?token=${encodeURIComponent(token)}`,
        { credentials: "same-origin" },
      );
      const data = await response.json();
      if (!response.ok || !data.valid) throw new Error(data.message);
      form.hidden = false;
    } catch (error) {
      message.textContent = error.message || "El enlace de restablecimiento no es válido.";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = form.elements.password.value;
    const confirmation = form.elements.passwordConfirmation.value;
    if (password !== confirmation) {
      message.textContent = "Las contraseñas no coinciden.";
      return;
    }

    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    message.textContent = "";
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      passwordUpdated = true;
      form.hidden = true;
      message.textContent = "Contraseña restablecida correctamente.";
      window.setTimeout(() => window.location.replace("/login.html"), 3000);
    } catch (error) {
      message.textContent = error.message || "No fue posible restablecer la contraseña.";
    } finally {
      submit.disabled = false;
    }
  });

  validateReset();
})();
