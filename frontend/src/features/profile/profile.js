(function () {
  "use strict";

  const form = document.getElementById("profile-form");
  const message = document.getElementById("profile-message");
  const scheduledTab = document.getElementById("scheduled-tab");
  const completedTab = document.getElementById("completed-tab");
  const scheduledPanel = document.getElementById("scheduled-panel");
  const completedPanel = document.getElementById("completed-panel");

  async function apiRequest(path, options) {
    const response = await fetch(path, Object.assign({
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    }, options));
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "No fue posible completar la solicitud.");
    return data;
  }

  async function loadProfile() {
    try {
      const session = await apiRequest("/api/auth/session");
      if (!session.authenticated) throw new Error("Sin sesión");
      if (session.user.role === "administrador") {
        window.location.replace("/admin.html");
        return;
      }

      const profileData = await apiRequest("/api/profile");
      const profile = profileData.profile;
      form.elements.fullName.value = profile.fullName;
      form.elements.phone.value = profile.phone;
      form.elements.email.value = profile.email;
      document.getElementById("profile-name").textContent = profile.fullName;
      document.getElementById("profile-email").textContent = profile.email;
      document.getElementById("profile-initials").textContent =
        profile.fullName
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join("");

      await loadAppointments();
    } catch (_error) {
      window.location.replace("/login.html");
    }
  }

  function renderAppointments(panel, appointments, emptyText) {
    if (!appointments.length) {
      panel.innerHTML = `<p class="appointment-empty">${emptyText}</p>`;
      return;
    }

    const escapeHtml = (value) => String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

    panel.innerHTML =
      '<div class="appointment-list">' +
      appointments.map((appointment) => `
        <article class="appointment-item">
          <time class="appointment-date" datetime="${appointment.date}T${appointment.time}">
            ${escapeHtml(appointment.date)}<br>${escapeHtml(appointment.time)}
          </time>
          <div class="appointment-details">
            <strong>${escapeHtml(appointment.specialty)}</strong>
            <span>${escapeHtml(appointment.doctor)}</span>
            <span>Folio: ${escapeHtml(appointment.folio)}</span>
          </div>
          <span class="appointment-status">${escapeHtml(appointment.status)}</span>
        </article>
      `).join("") +
      "</div>";
  }

  async function loadAppointments() {
    const appointments = await apiRequest("/api/profile/appointments");
    renderAppointments(scheduledPanel, appointments.scheduled, "No tienes citas agendadas.");
    renderAppointments(completedPanel, appointments.completed, "Aún no tienes citas completadas.");
  }

  function selectTab(selected, unselected, selectedPanel, unselectedPanel) {
    selected.setAttribute("aria-selected", "true");
    unselected.setAttribute("aria-selected", "false");
    selectedPanel.hidden = false;
    unselectedPanel.hidden = true;
  }

  scheduledTab.addEventListener("click", function () {
    selectTab(scheduledTab, completedTab, scheduledPanel, completedPanel);
  });

  completedTab.addEventListener("click", function () {
    selectTab(completedTab, scheduledTab, completedPanel, scheduledPanel);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    message.textContent = "";

    try {
      const data = await apiRequest("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: form.elements.fullName.value,
          phone: form.elements.phone.value,
          email: form.elements.email.value,
        }),
      });
      document.getElementById("profile-name").textContent = data.profile.fullName;
      document.getElementById("profile-email").textContent = data.profile.email;
      message.textContent = "Datos actualizados correctamente.";
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  document.getElementById("profile-logout").addEventListener("click", async function () {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    window.location.replace("/login.html");
  });

  loadProfile();
})();
