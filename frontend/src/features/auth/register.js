(function () {
  "use strict";

  const form = document.getElementById("register-form");
  const message = document.getElementById("register-message");
  const resumeBooking =
    new URLSearchParams(window.location.search).get("cita") === "continuar";
  const loginPath = resumeBooking
    ? "/login.html?cita=continuar"
    : "/login.html";
  const homePath = resumeBooking ? "/index.html?cita=continuar" : "/index.html";
  document.getElementById("login-link").href = loginPath;

  fetch("/api/auth/session", { credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) return null;
      return response.json();
    })
    .then((session) => {
      if (!session || !session.authenticated) return;
      window.location.replace(
        session.user.role === "administrador" ? "/admin.html" : homePath,
      );
    })
    .catch(() => {});

  const panel = document.getElementById("reactivation");
  const reactivateForm = document.getElementById("reactivation-form");
  const previousEmail = document.getElementById("previous-email");
  const reactivateMessage = document.getElementById("reactivation-message");
  const decline = document.getElementById("decline-reactivation");

  decline.addEventListener("click", () => {
    panel.hidden = true;
    form.hidden = false;
    reactivateForm.reset();
    message.textContent =
      "Ingresa un correo electrónico diferente para crear una cuenta.";
    form.elements.email.focus();
    form.elements.email.select();
  });

  reactivateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = reactivateForm.querySelector("button");
    submit.disabled = decline.disabled = true;
    reactivateMessage.textContent = "";
    try {
      const response = await fetch("/api/auth/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: previousEmail.textContent,
          password: reactivateForm.elements.password.value,
        }),
      });
      if (response.ok) window.location.replace(loginPath);
      else reactivateMessage.textContent = (await response.json()).message;
    } catch (_error) {
      reactivateMessage.textContent =
        "No fue posible conectar con el servidor.";
    } finally {
      submit.disabled = decline.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    const email = form.elements.email.value.trim();

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: form.elements.fullName.value,
          phone: form.elements.phone.value,
          email,
          password: form.elements.password.value,
        }),
      });
      const data = await response.json();
      if (response.status === 409 && data.code === "ACCOUNT_INACTIVE") {
        previousEmail.textContent = email;
        reactivateMessage.textContent = "";
        form.hidden = true;
        form.elements.password.value = "";
        panel.hidden = false;
        document.getElementById("reactivation-title").focus();
        return;
      }
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
