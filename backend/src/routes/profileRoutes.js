import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  getAppointmentsController,
  rescheduleAppointmentController,
} from '../controllers/profileController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.use('/api/profile', requireAuth);
router.get('/api/profile', getProfileController);
router.patch('/api/profile', updateProfileController);
router.get('/api/profile/appointments', getAppointmentsController);
router.patch('/api/profile/appointments/:appointmentId', rescheduleAppointmentController);

export default router;
