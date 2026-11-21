import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  getAppointmentsController,
} from '../controllers/profileController.js';

const router = Router();

router.get('/api/profile', getProfileController);
router.patch('/api/profile', updateProfileController);
router.get('/api/profile/appointments', getAppointmentsController);

export default router;
