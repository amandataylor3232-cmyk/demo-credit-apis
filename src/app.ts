import express from 'express';
import userRoutes from './routes/user.routes';
import walletRoutes from './routes/wallet.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Demo Credit wallet service is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);

app.use(errorHandler);

export default app;
