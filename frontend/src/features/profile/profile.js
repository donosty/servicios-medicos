(function () {
  "use strict";

  const form = document.getElementById("profile-form");
  const message = document.getElementById("profile-message");
  const scheduledTab = document.getElementById("scheduled-tab");
  const completedTab = document.getElementById("completed-tab");
  const scheduledPanel = document.getElementById("scheduled-panel");
  const completedPanel = document.getElementById("completed-panel");

  async function apiRequest(path, options) {
    const response = await fetch(
      path,
      Object.assign(
        {
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        },
        options,
      ),
    );
    if (response.status === 204) return;
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || "No fue posible completar la solicitud.");
    return data;
  }

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

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
      document.getElementById("profile-initials").textContent = profile.fullName
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

    const rescheduleNotice =
      panel === scheduledPanel
        ? "<p>Puedes cambiar el horario una sola vez, con al menos 24 horas de anticipación a la cita original.</p>"
        : "";
    panel.innerHTML =
      rescheduleNotice +
      '<div class="appointment-list">' +
      appointments
        .map(
          (appointment) => `
        <article class="appointment-item">
          <time class="appointment-date" datetime="${appointment.date}T${appointment.time}">
            ${escapeHtml(appointment.date)}<br>${escapeHtml(appointment.time)}
          </time>
          <div class="appointment-details">
            <strong>${escapeHtml(appointment.specialty)}</strong>
            <span>${escapeHtml(appointment.doctor)}</span>
            <span>Folio: ${escapeHtml(appointment.folio)}</span>
          </div>
          <div class="appointment-side">
            <span class="appointment-status">${escapeHtml(appointment.status)}</span>
            ${
              appointment.canReschedule === true
                ? `
              <button
                type="button"
                class="reschedule-toggle"
                data-appointment-id="${escapeHtml(appointment.appointmentId)}"
                data-doctor-id="${escapeHtml(appointment.doctorId)}"
                data-date="${escapeHtml(appointment.date)}"
                data-time="${escapeHtml(appointment.time)}"
                aria-expanded="false"
                aria-controls="reschedule-${escapeHtml(appointment.appointmentId)}"
              >
                Editar cita
              </button>
              <div class="reschedule-editor" id="reschedule-${escapeHtml(appointment.appointmentId)}" hidden>
                <label>
                  Nueva fecha
                  <select class="reschedule-date" aria-label="Nueva fecha">
                    ${buildAvailableDates()
                      .map(
                        (date) => `
                      <option value="${date.value}"${date.value === appointment.date ? " selected" : ""}>
                        ${escapeHtml(date.label)}
                      </option>
                    `,
                      )
                      .join("")}
                  </select>
                </label>
                <label>
                  Nueva hora
                  <select class="reschedule-time" aria-label="Nueva hora">
                    <option value="">Cargando horarios…</option>
                  </select>
                </label>
                <button type="button" class="reschedule-confirm" disabled>Confirmar cambio</button>
                <p class="reschedule-message" role="alert"></p>
              </div>
            `
                : `
              <span class="reschedule-unavailable">
                ${
                  appointment.rescheduled
                    ? "Cita ya reprogramada"
                    : appointment.statusCode === "confirmada"
                      ? "Cambio no disponible a menos de 24 horas"
                      : "Solo las citas confirmadas pueden editarse"
                }
              </span>
            `
            }
          </div>
        </article>
      `,
        )
        .join("") +
      "</div>";
  }

  async function loadAppointments() {
    const appointments = await apiRequest("/api/profile/appointments");
    renderAppointments(
      scheduledPanel,
      appointments.scheduled,
      "No tienes citas agendadas.",
    );
    renderAppointments(
      completedPanel,
      appointments.completed,
      "Aún no tienes citas completadas.",
    );
  }

  function buildAvailableDates() {
    const monthNames = [
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ];
    const dayNames = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    const clinicDate = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = Object.fromEntries(
      clinicDate
        .formatToParts(new Date())
        .map((part) => [part.type, part.value]),
    );
    const today = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
    );
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + offset + 1);
      return {
        value: date.toISOString().slice(0, 10),
        label: `${dayNames[date.getUTCDay()]} ${date.getUTCDate()} de ${monthNames[date.getUTCMonth()]}`,
      };
    });
  }

  function formatTime(time) {
    const [hourText, minute] = time.split(":");
    const hour = Number(hourText);
    return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
  }

  function selectTab(selected, unselected, selectedPanel, unselectedPanel) {
    selected.setAttribute("aria-selected", "true");
    unselected.setAttribute("aria-selected", "false");
    selectedPanel.hidden = false;
    unselectedPanel.hidden = true;
  }

  async function loadRescheduleTimes(article) {
    const toggle = article.querySelector(".reschedule-toggle");
    const dateSelect = article.querySelector(".reschedule-date");
    const timeSelect = article.querySelector(".reschedule-time");
    if (!toggle || !dateSelect || !timeSelect) return;

    const doctorId = toggle.dataset.doctorId;
    const appointmentId = toggle.dataset.appointmentId;
    const date = dateSelect.value;
    timeSelect.innerHTML = '<option value="">Cargando horarios…</option>';
    timeSelect.disabled = true;
    const confirmButton = article.querySelector(".reschedule-confirm");
    confirmButton.disabled = true;

    try {
      const query = new URLSearchParams({
        doctorId,
        date,
        excludeAppointmentId: appointmentId,
      });
      const data = await apiRequest(`/api/availability?${query}`);
      const times = data.times || [];
      const currentTime = toggle.dataset.time;
      const options = times.map(
        (time) => `
        <option value="${escapeHtml(time)}"${date === toggle.dataset.date && time === currentTime ? " selected" : ""}>
          ${escapeHtml(formatTime(time))}
        </option>
      `,
      );
      timeSelect.innerHTML =
        '<option value="">Selecciona una hora</option>' + options.join("");
      timeSelect.disabled = false;
      confirmButton.disabled = true;

      timeSelect.onchange = () => {
        confirmButton.disabled =
          !timeSelect.value ||
          (date === toggle.dataset.date &&
            timeSelect.value === toggle.dataset.time);
      };
    } catch (error) {
      timeSelect.innerHTML =
        '<option value="">No fue posible cargar los horarios</option>';
      article.querySelector(".reschedule-message").textContent = error.message;
    }
  }

  scheduledPanel.addEventListener("click", async function (event) {
    const toggle = event.target.closest(".reschedule-toggle");
    if (toggle) {
      const editor = document.getElementById(
        `reschedule-${toggle.dataset.appointmentId}`,
      );
      const isOpen = !editor.hidden;
      scheduledPanel.querySelectorAll(".reschedule-editor").forEach((item) => {
        item.hidden = true;
      });
      scheduledPanel
        .querySelectorAll(".reschedule-toggle")
        .forEach((button) => {
          button.setAttribute("aria-expanded", "false");
        });
      editor.hidden = isOpen;
      toggle.setAttribute("aria-expanded", String(!isOpen));
      if (!isOpen)
        await loadRescheduleTimes(editor.closest(".appointment-item"));
      return;
    }

    const confirmButton = event.target.closest(".reschedule-confirm");
    if (!confirmButton) return;

    const article = confirmButton.closest(".appointment-item");
    const toggleButton = article.querySelector(".reschedule-toggle");
    const dateSelect = article.querySelector(".reschedule-date");
    const timeSelect = article.querySelector(".reschedule-time");
    const message = article.querySelector(".reschedule-message");
    confirmButton.disabled = true;
    message.textContent = "";

    try {
      const data = await apiRequest(
        `/api/profile/appointments/${toggleButton.dataset.appointmentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            date: dateSelect.value,
            time: timeSelect.value,
          }),
        },
      );
      const emailNotice = data.emailSent ? "Te enviamos el cambio por correo." : "No se pudo enviar el correo.";
      document.getElementById("reschedule-result").textContent =
        `Horario actualizado: ${data.appointment.date} a las ${formatTime(data.appointment.time)}. ${emailNotice}`;
      await loadAppointments();
    } catch (error) {
      message.textContent = error.message;
      confirmButton.disabled = false;
    }
  });

  scheduledPanel.addEventListener("change", function (event) {
    if (!event.target.matches(".reschedule-date")) return;
    loadRescheduleTimes(event.target.closest(".appointment-item"));
  });

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
      document.getElementById("profile-name").textContent =
        data.profile.fullName;
      document.getElementById("profile-email").textContent = data.profile.email;
      message.textContent = "Datos actualizados correctamente.";
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  const dialog = document.getElementById("account-dialog");
  const confirmButton = document.getElementById("account-confirm");
  const cancelButton = document.getElementById("account-cancel");
  const accountError = document.getElementById("account-error");
  let countdown;

  document
    .getElementById("deactivate-account")
    .addEventListener("click", () => {
      let seconds = 5;
      accountError.textContent = "";
      confirmButton.disabled = true;
      confirmButton.textContent = `Desactivar cuenta (${seconds} s)`;
      dialog.showModal();
      countdown = setInterval(() => {
        seconds -= 1;
        if (seconds > 0) {
          confirmButton.textContent = `Desactivar cuenta (${seconds} s)`;
        } else {
          clearInterval(countdown);
          confirmButton.textContent = "Desactivar cuenta";
          confirmButton.disabled = false;
        }
      }, 1000);
    });

  cancelButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => clearInterval(countdown));
  dialog.addEventListener("cancel", (event) => {
    if (cancelButton.disabled) event.preventDefault();
  });
  confirmButton.addEventListener("click", async () => {
    if (confirmButton.disabled) return;
    confirmButton.disabled = true;
    cancelButton.disabled = true;
    try {
      await apiRequest("/api/profile", { method: "DELETE" });
      window.location.replace("/login.html");
    } catch (error) {
      accountError.textContent = error.message;
      cancelButton.disabled = false;
      confirmButton.disabled = false;
    }
  });

  document
    .getElementById("profile-logout")
    .addEventListener("click", async function () {
      if (!window.confirm("¿Quieres cerrar sesión?")) return;
      try {
        await apiRequest("/api/auth/logout", { method: "POST" });
        window.location.replace("/login.html");
      } catch (error) {
        message.textContent = error.message;
      }
    });

  loadProfile();
})();
