(function () {
  "use strict";

  const form = document.getElementById("login-form");
  const message = document.getElementById("login-message");

  fetch("/api/auth/session", { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) return null;
      return response.json();
    })
    .then((session) => {
      if (!session || !session.authenticated) return;
      window.location.replace(session.user.role === "administrador" ? "/admin.html" : "/index.html");
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: form.elements.email.value,
          password: form.elements.password.value,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        message.textContent = data.message || "No fue posible iniciar sesión.";
        return;
      }
      window.location.replace(data.user.role === "administrador" ? "/admin.html" : "/index.html");
    } catch (_error) {
      message.textContent = "No fue posible conectar con el servidor.";
    } finally {
      submit.disabled = false;
    }
  });
})();
