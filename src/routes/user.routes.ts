import { Router } from 'express';
import { register, getProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.get('/me', authenticate, getProfile);

export default router;
