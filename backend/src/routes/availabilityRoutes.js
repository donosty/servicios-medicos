import { Router } from 'express';
import { getAvailability } from '../controllers/availabilityController.js';

const router = Router();

router.get('/api/availability', getAvailability);

export default router;
