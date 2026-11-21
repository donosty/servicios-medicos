import { Router } from 'express';

const router = Router();

router.get('/api', (_request, response) => {
  response.json({ message: 'Servicios Médicos API' });
});

export default router;
