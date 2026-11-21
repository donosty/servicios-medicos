import { Router } from 'express';
import { register, login, session, logout } from '../controllers/authController.js';

const router = Router();

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.get('/api/auth/session', session);
router.post('/api/auth/logout', logout);

export default router;
