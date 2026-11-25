import { Router } from "express";
import {
  register,
  reactivate,
  login,
  session,
  logout,
  requestPasswordResetController,
  validatePasswordResetController,
  cancelPasswordResetController,
  resetPasswordController,
  confirmEmailController,
  resendEmailConfirmationController,
} from "../controllers/authController.js";

const router = Router();

router.post("/api/auth/register", register);
<<<<<<< HEAD
router.post("/api/auth/reactivate", reactivate);
=======
router.post("/api/auth/email-confirmation/confirm", confirmEmailController);
router.post(
  "/api/auth/email-confirmation/resend",
  resendEmailConfirmationController,
);
>>>>>>> beeaa7f (Confirmar cuenta y folio)
router.post("/api/auth/login", login);
router.get("/api/auth/session", session);
router.post("/api/auth/logout", logout);
router.post("/api/auth/password-reset/request", requestPasswordResetController);
router.get(
  "/api/auth/password-reset/validate",
  validatePasswordResetController,
);
router.post("/api/auth/password-reset/cancel", cancelPasswordResetController);
router.post("/api/auth/password-reset", resetPasswordController);

export default router;
