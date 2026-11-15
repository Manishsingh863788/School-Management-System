import { Router } from 'express';
import { login, getMe, logout } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateJwt } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), login);
router.get('/me', authenticateJwt, getMe);
router.post('/logout', authenticateJwt, logout);

export default router;
