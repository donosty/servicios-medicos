import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
import {
  getAdminData,
  saveDirectoryEntry,
  createAdminService,
  updateAdminService,
  createAdminSlot,
  updateAdminSlot,
  deleteAdminSlot,
  updateAdminAppointmentStatus,
} from "../services/adminService.js";

const router = Router();

router.get("/api", (_request, response) => {
  response.json({ message: "Servicios Médicos API" });
});

router.use("/api/admin", requireAuth, requireRole("administrador"));

router.get("/api/admin/data", async (_request, response, next) => {
  try {
    response.set("Cache-Control", "no-store").json(await getAdminData());
  } catch (error) {
    next(error);
  }
});

for (const kind of ["doctors", "specialties"]) {
  const save = async (request, response, next) => {
    try {
      const data = await saveDirectoryEntry(kind, request.params.id, request.body);
      response.status(request.params.id ? 200 : 201).json(data);
    } catch (error) {
      next(error);
    }
  };
  router.post(`/api/admin/${kind}`, save);
  router.patch(`/api/admin/${kind}/:id`, save);
}

router.post("/api/admin/services", async (request, response, next) => {
  try {
    const data = request.body;
    if (
      !data.name ||
      String(data.name).trim().length < 3 ||
      !data.description
    ) {
      return response
        .status(400)
        .json({ message: "Indica nombre y descripción válidos." });
    }
    response.status(201).json(await createAdminService(data));
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/api/admin/services/:serviceId",
  async (request, response, next) => {
    try {
      const data = request.body;
      if (
        !data.name ||
        String(data.name).trim().length < 3 ||
        !data.description
      ) {
        return response
          .status(400)
          .json({ message: "Indica nombre y descripción válidos." });
      }
      response.json(await updateAdminService(request.params.serviceId, data));
    } catch (error) {
      next(error);
    }
  },
);

function validateSlotSchedule(request, response, next) {
  const { dayOfWeek, startTime } = request.body;
  if (
    dayOfWeek !== undefined &&
    !((typeof dayOfWeek === "number" || typeof dayOfWeek === "string") &&
      /^[1-6]$/.test(String(dayOfWeek)))
  ) {
    return response.status(400).json({ message: "Selecciona un día de lunes a sábado." });
  }
  if (
    startTime !== undefined &&
    (typeof startTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))
  ) {
    return response.status(400).json({ message: "Selecciona una hora válida." });
  }
  next();
}

router.post("/api/admin/slots", validateSlotSchedule, async (request, response, next) => {
  try {
    const { doctorId, dayOfWeek, startTime, durationMinutes, isActive } =
      request.body;
    if (
      !doctorId ||
      dayOfWeek === undefined ||
      startTime === undefined
    ) {
      return response
        .status(400)
        .json({ message: "Indica médico, día y hora válidos." });
    }
    const slot = await createAdminSlot({
      doctorId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      durationMinutes:
        durationMinutes === undefined ? 30 : Number(durationMinutes),
      isActive: isActive !== false,
    });
    response.status(201).json({ slot });
  } catch (error) {
    next(error);
  }
});

router.patch("/api/admin/slots/:slotId", validateSlotSchedule, async (request, response, next) => {
  try {
    const data = { ...request.body };
    if (data.dayOfWeek !== undefined) data.dayOfWeek = Number(data.dayOfWeek);
    if (data.durationMinutes !== undefined)
      data.durationMinutes = Number(data.durationMinutes);
    response.json({ slot: await updateAdminSlot(request.params.slotId, data) });
  } catch (error) {
    next(error);
  }
});

router.delete("/api/admin/slots/:slotId", async (request, response, next) => {
  try {
    await deleteAdminSlot(request.params.slotId);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/api/admin/appointments/:appointmentId/status",
  async (request, response, next) => {
    try {
      const statusId = Number(request.body.statusId);
      if (!Number.isInteger(statusId) || statusId <= 0) {
        return response
          .status(400)
          .json({ message: "Indica un estado válido." });
      }
      response.json({
        appointment: await updateAdminAppointmentStatus(
          request.params.appointmentId,
          statusId,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
