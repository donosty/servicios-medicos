(function () {
  "use strict";

  const form = document.getElementById("login-form");
  const message = document.getElementById("login-message");
  const resumeBooking = new URLSearchParams(window.location.search).get("cita") === "continuar";
  const homePath = resumeBooking ? "/index.html?cita=continuar" : "/index.html";

  if (resumeBooking) {
    document.querySelector(".auth-intro").textContent = "Inicia sesión para continuar con tu cita.";
    document.getElementById("register-link").href = "/register.html?cita=continuar";
    const homeLink = document.getElementById("home-link");
    homeLink.href = homePath;
    homeLink.textContent = "Volver a mi selección";
  }

  function redirectUser(user) {
    window.location.replace(user.role === "administrador" ? "/admin.html" : homePath);
  }

  fetch("/api/auth/session", { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) return null;
      return response.json();
    })
    .then((session) => {
      if (!session || !session.authenticated) return;
      redirectUser(session.user);
    })
    .catch(() => {});

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
      redirectUser(data.user);
    } catch (_error) {
      message.textContent = "No fue posible conectar con el servidor.";
    } finally {
      submit.disabled = false;
    }
  });
})();
