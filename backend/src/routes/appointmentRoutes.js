import { Router } from 'express';
import { createAppointmentController } from '../controllers/appointmentController.js';

const router = Router();

router.post('/api/appointments', createAppointmentController);

export default router;
