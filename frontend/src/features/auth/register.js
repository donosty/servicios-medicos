(function () {
  "use strict";

  const form = document.getElementById("register-form");
  const message = document.getElementById("register-message");
  const resumeBooking = new URLSearchParams(window.location.search).get("cita") === "continuar";
  const loginPath = resumeBooking ? "/login.html?cita=continuar" : "/login.html";
  const homePath = resumeBooking ? "/index.html?cita=continuar" : "/index.html";
  document.getElementById("login-link").href = loginPath;

  fetch("/api/auth/session", { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) return null;
      return response.json();
    })
    .then((session) => {
      if (!session || !session.authenticated) return;
      window.location.replace(session.user.role === "administrador" ? "/admin.html" : homePath);
    })
    .catch(() => {});

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: form.elements.fullName.value,
          phone: form.elements.phone.value,
          email: form.elements.email.value,
          password: form.elements.password.value,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        message.textContent = data.message || "No fue posible crear la cuenta.";
        return;
      }
      window.location.replace(loginPath);
    } catch (_error) {
      message.textContent = "No fue posible conectar con el servidor.";
    } finally {
      submit.disabled = false;
    }
  });
})();
