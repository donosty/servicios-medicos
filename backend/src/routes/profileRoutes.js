import { Router } from "express";
import {
  getProfileController,
  deactivateProfileController,
  updateProfileController,
  getAppointmentsController,
  rescheduleAppointmentController,
} from "../controllers/profileController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = Router();

router.use("/api/profile", requireAuth);
router.get("/api/profile", getProfileController);
router.patch("/api/profile", updateProfileController);
router.delete(
  "/api/profile",
  requireRole("consumidor"),
  deactivateProfileController,
);
router.get("/api/profile/appointments", getAppointmentsController);
router.patch(
  "/api/profile/appointments/:appointmentId",
  rescheduleAppointmentController,
);

export default router;
