import { Router } from 'express';
import { getSpecialties } from '../controllers/specialtyController.js';

const router = Router();

router.get('/api/specialties', getSpecialties);

export default router;
