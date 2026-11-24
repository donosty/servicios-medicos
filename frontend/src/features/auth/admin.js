(function () {
  "use strict";

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  let adminData = null;
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  async function apiRequest(path, options) {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (response.status === 204) return null;
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_error) {
      if (!response.ok) {
        throw new Error(`El servidor respondió con un error (${response.status}).`);
      }
      throw new Error("El servidor no devolvió una respuesta JSON válida.");
    }
    if (!response.ok) throw new Error(data.message || "No fue posible completar la solicitud.");
    return data;
  }

  function setMessage(message, isError) {
    const element = document.getElementById("admin-message");
    element.textContent = message;
    element.className = `admin-message${isError ? " is-error" : ""}`;
  }

  function showSection(section) {
    document.querySelectorAll("[data-section]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.section === section);
    });
    document.querySelectorAll("[data-admin-section]").forEach((panel) => {
      const active = panel.dataset.adminSection === section;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    const titles = {
      overview: "Resumen",
      services: "Servicios y precios",
      availability: "Disponibilidad",
      appointments: "Citas",
    };
    document.getElementById("admin-heading-title").textContent = titles[section];
  }

  function renderStats() {
    const stats = [
      ["Servicios activos", adminData.services.filter((item) => item.isActive).length],
      ["Especialidades", adminData.specialties.length],
      ["Médicos", adminData.doctors.length],
      ["Citas registradas", adminData.appointments.length],
    ];
    document.getElementById("admin-stats").innerHTML = stats.map(([label, value]) => `
      <article class="admin-stat">
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(label)}</span>
      </article>
    `).join("");
  }

  function renderServices() {
    document.getElementById("admin-services-list").innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Servicio</th><th>Precio</th><th>Orden</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          ${adminData.services.map((service) => `
            <tr>
              <td><strong>${escapeHtml(service.name)}</strong><small>${escapeHtml(service.slug)}</small></td>
              <td>${service.price === null ? "Sin precio" : `$${Number(service.price).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`}</td>
              <td>${escapeHtml(service.displayOrder)}</td>
              <td><span class="admin-status ${service.isActive ? "is-active" : "is-inactive"}">${service.isActive ? "Activo" : "Inactivo"}</span></td>
              <td><button type="button" class="admin-edit" data-service-id="${escapeHtml(service.id)}">Modificar</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  function renderDoctorOptions() {
    document.getElementById("admin-slot-doctor").innerHTML =
      '<option value="">Selecciona un médico</option>' +
      adminData.doctors.map((doctor) => `
        <option value="${escapeHtml(doctor.id)}">${escapeHtml(doctor.name)}</option>
      `).join("");
  }

  function renderSlots() {
    const rows = adminData.doctors.flatMap((doctor) =>
      doctor.slots.map((slot) => ({ doctor, slot })),
    );
    document.getElementById("admin-slots-list").innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Médico</th><th>Día</th><th>Hora</th><th>Duración</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map(({ doctor, slot }) => `
            <tr>
              <td><strong>${escapeHtml(doctor.name)}</strong></td>
              <td>${dayNames[slot.dayOfWeek]}</td>
              <td>${escapeHtml(slot.startTime)}</td>
              <td>${escapeHtml(slot.durationMinutes)} min</td>
              <td><span class="admin-status ${slot.isActive ? "is-active" : "is-inactive"}">${slot.isActive ? "Activo" : "Inactivo"}</span></td>
              <td>
                <button type="button" class="admin-edit" data-slot-id="${escapeHtml(slot.id)}">Modificar</button>
                <button type="button" class="admin-delete" data-delete-slot-id="${escapeHtml(slot.id)}">Eliminar</button>
              </td>
            </tr>
          `).join("") : '<tr><td colspan="6">No hay horarios registrados.</td></tr>'}
        </tbody>
      </table>
    `;
  }

  function renderAppointments() {
    document.getElementById("admin-appointments-list").innerHTML = `
      <table class="admin-table admin-appointments-table">
        <thead><tr><th>Folio y paciente</th><th>Médico</th><th>Fecha y hora</th><th>Estado</th><th>Historial</th></tr></thead>
        <tbody>
          ${adminData.appointments.length ? adminData.appointments.map((appointment) => `
            <tr>
              <td>
                <strong>${escapeHtml(appointment.patient)}</strong>
                <small>${escapeHtml(appointment.folio)} · ${escapeHtml(appointment.phone)}</small>
              </td>
              <td>${escapeHtml(appointment.doctor)}<small>${escapeHtml(appointment.specialty)}</small></td>
              <td>${escapeHtml(appointment.date)} · ${escapeHtml(appointment.time)}</td>
              <td>
                <select class="admin-status-select" data-appointment-id="${escapeHtml(appointment.id)}" aria-label="Estado de ${escapeHtml(appointment.folio)}">
                  ${adminData.statuses.map((status) => `
                    <option value="${escapeHtml(status.id)}"${status.id === appointment.statusId ? " selected" : ""}>${escapeHtml(status.name)}</option>
                  `).join("")}
                </select>
              </td>
              <td>
                ${appointment.rescheduleHistory?.length ? `
                  <details class="appointment-history">
                    <summary>${appointment.rescheduleHistory.length} cambio${appointment.rescheduleHistory.length === 1 ? "" : "s"}</summary>
                    ${appointment.rescheduleHistory.map((history) => `
                      <div class="appointment-history-item">
                        <strong>${escapeHtml(history.changedAt ? new Date(history.changedAt).toLocaleString("es-MX") : "Cambio registrado")}</strong>
                        <span><b>Anterior:</b> ${escapeHtml(history.previous?.date)} · ${escapeHtml(history.previous?.time)}</span>
                        <span><b>Actualizada:</b> ${escapeHtml(history.updated?.date)} · ${escapeHtml(history.updated?.time)}</span>
                      </div>
                    `).join("")}
                  </details>
                ` : '<span class="appointment-history-empty">Sin cambios</span>'}
              </td>
            </tr>
          `).join("") : '<tr><td colspan="5">No hay citas registradas.</td></tr>'}
        </tbody>
      </table>
    `;
  }

  function renderAll() {
    renderStats();
    renderServices();
    renderDoctorOptions();
    renderSlots();
    renderAppointments();
  }

  async function loadAdminData(showLoading) {
    try {
      if (showLoading) setMessage("Cargando información…", false);
      adminData = await apiRequest("/api/admin/data");
      renderAll();
      if (showLoading) setMessage("", false);
    } catch (error) {
      setMessage(error.message, true);
    }
  }

  function openServiceForm(service) {
    document.getElementById("admin-service-form").hidden = false;
    document.getElementById("admin-service-id").value = service?.id ?? "";
    document.getElementById("admin-service-name").value = service?.name ?? "";
    document.getElementById("admin-service-slug").value = service?.slug ?? "";
    document.getElementById("admin-service-price").value = service?.price ?? "";
    document.getElementById("admin-service-description").value = service?.description ?? "";
    document.getElementById("admin-service-title").value = service?.catalogTitle ?? service?.name ?? "";
    document.getElementById("admin-service-category").value = service?.category ?? "";
    document.getElementById("admin-service-catalog-description").value = service?.catalogDescription ?? service?.description ?? "";
    document.getElementById("admin-service-active").checked = service?.isActive ?? true;
    const order = document.getElementById("admin-service-order");
    order.innerHTML = Array.from({ length: 21 }, (_, value) =>
      `<option value="${value}">${value}</option>`,
    ).join("");
    order.value = String(service?.displayOrder ?? 0);
  }

  document.querySelectorAll(".admin-nav-button").forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.section));
  });

  document.getElementById("admin-new-service").addEventListener("click", () => openServiceForm());
  document.getElementById("admin-cancel-service").addEventListener("click", () => {
    document.getElementById("admin-service-form").hidden = true;
  });

  document.getElementById("admin-service-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("admin-service-id").value;
    const payload = {
      name: document.getElementById("admin-service-name").value.trim(),
      description: document.getElementById("admin-service-description").value.trim(),
      catalogTitle: document.getElementById("admin-service-title").value.trim() || null,
      catalogDescription: document.getElementById("admin-service-catalog-description").value.trim() || null,
      category: document.getElementById("admin-service-category").value.trim() || null,
      price: document.getElementById("admin-service-price").value === ""
        ? null
        : Number(document.getElementById("admin-service-price").value),
      displayOrder: Number(document.getElementById("admin-service-order").value),
      catalogOrder: Number(document.getElementById("admin-service-order").value),
      isActive: document.getElementById("admin-service-active").checked,
      features: [],
    };
    const slug = document.getElementById("admin-service-slug").value.trim();
    if (slug) payload.slug = slug;

    try {
      adminData = id
        ? await apiRequest(`/api/admin/services/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await apiRequest("/api/admin/services", { method: "POST", body: JSON.stringify(payload) });
      renderAll();
      document.getElementById("admin-service-form").hidden = true;
      setMessage(id ? "Servicio actualizado." : "Servicio registrado.", false);
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  document.getElementById("admin-services-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-service-id]");
    if (!button) return;
    const service = adminData.services.find((item) => String(item.id) === button.dataset.serviceId);
    if (service) openServiceForm(service);
  });

  document.getElementById("admin-slot-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const slotId = document.getElementById("admin-slot-id").value;
    const payload = {
      doctorId: document.getElementById("admin-slot-doctor").value,
      dayOfWeek: Number(document.getElementById("admin-slot-day").value),
      startTime: document.getElementById("admin-slot-time").value,
      durationMinutes: Number(document.getElementById("admin-slot-duration").value),
      isActive: document.getElementById("admin-slot-active").checked,
    };
    if (!payload.doctorId) {
      setMessage("Selecciona un médico.", true);
      return;
    }

    try {
      if (slotId) {
        await apiRequest(`/api/admin/slots/${slotId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setMessage("Horario actualizado.", false);
      } else {
        await apiRequest("/api/admin/slots", { method: "POST", body: JSON.stringify(payload) });
        setMessage("Horario registrado.", false);
      }
      clearSlotForm();
      await loadAdminData(false);
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  function clearSlotForm() {
    document.getElementById("admin-slot-id").value = "";
    document.getElementById("admin-slot-doctor").value = "";
    document.getElementById("admin-slot-day").value = "1";
    document.getElementById("admin-slot-time").value = "";
    document.getElementById("admin-slot-duration").value = "30";
    document.getElementById("admin-slot-active").checked = true;
  }

  document.getElementById("admin-cancel-slot").addEventListener("click", clearSlotForm);

  document.getElementById("admin-slots-list").addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-slot-id]");
    if (editButton) {
      for (const doctor of adminData.doctors) {
        const slot = doctor.slots.find((item) => String(item.id) === editButton.dataset.slotId);
        if (!slot) continue;
        document.getElementById("admin-slot-id").value = slot.id;
        document.getElementById("admin-slot-doctor").value = doctor.id;
        document.getElementById("admin-slot-day").value = String(slot.dayOfWeek);
        document.getElementById("admin-slot-time").value = slot.startTime;
        document.getElementById("admin-slot-duration").value = String(slot.durationMinutes);
        document.getElementById("admin-slot-active").checked = slot.isActive;
        document.getElementById("admin-slot-form").scrollIntoView({ behavior: "smooth" });
        break;
      }
      return;
    }

    const deleteButton = event.target.closest("[data-delete-slot-id]");
    if (!deleteButton) return;
    if (!window.confirm("¿Eliminar este horario de disponibilidad?")) return;
    try {
      await apiRequest(`/api/admin/slots/${deleteButton.dataset.deleteSlotId}`, { method: "DELETE" });
      setMessage("Horario eliminado.", false);
      await loadAdminData(false);
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  document.getElementById("admin-appointments-list").addEventListener("change", async (event) => {
    const select = event.target.closest("[data-appointment-id]");
    if (!select) return;
    try {
      await apiRequest(`/api/admin/appointments/${select.dataset.appointmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ statusId: Number(select.value) }),
      });
      setMessage("Estado de la cita actualizado.", false);
      await loadAdminData(false);
    } catch (error) {
      setMessage(error.message, true);
      await loadAdminData(false);
    }
  });

  document.getElementById("admin-logout").addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    window.location.replace("/login.html");
  });

  async function initialize() {
    try {
      const session = await apiRequest("/api/auth/session");
      if (!session.authenticated || session.user.role !== "administrador") {
        window.location.replace("/login.html");
        return;
      }
      document.getElementById("admin-name").textContent = session.user.fullName;
      await loadAdminData(true);
      window.setInterval(() => loadAdminData(false), 30000);
    } catch (_error) {
      window.location.replace("/login.html");
    }
  }

  initialize();
})();
