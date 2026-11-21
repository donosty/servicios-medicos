(function () {
  "use strict";

  fetch("/api/auth/session", { credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Sin sesión");
      return response.json();
    })
    .then((session) => {
      if (!session.authenticated || session.user.role !== "administrador") {
        window.location.replace("/login.html");
        return;
      }
      document.getElementById("admin-name").textContent = session.user.fullName;
    })
    .catch(() => window.location.replace("/login.html"));

  document.getElementById("admin-logout").addEventListener("click", async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    window.location.replace("/login.html");
  });
})();
