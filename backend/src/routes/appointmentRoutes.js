import { Router } from "express";
import { createAppointmentController } from "../controllers/appointmentController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/api/appointments", requireAuth, createAppointmentController);

export default router;
