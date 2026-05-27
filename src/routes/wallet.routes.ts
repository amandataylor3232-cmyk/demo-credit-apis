import { Router } from 'express';
import {
  fundWallet,
  transferFunds,
  withdrawFunds,
  getBalance,
  getTransactions,
} from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/fund', fundWallet);
router.post('/transfer', transferFunds);
router.post('/withdraw', withdrawFunds);

export default router;
