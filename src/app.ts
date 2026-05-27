import express from 'express';
import userRoutes from './routes/user.routes';
import walletRoutes from './routes/wallet.routes';
import { errorHandler } from './middleware/error.middleware';
import { db } from './db';

const app = express();

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({
      success: true,
      message: 'Demo Credit wallet service is running',
      database: 'connected',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Database connection failed';
    console.error('Health check database error:', error);
    res.status(503).json({
      success: false,
      message: 'Service is running but database is not reachable',
      database: 'disconnected',
      error: message,
    });
  }
});

app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);

app.use(errorHandler);

export default app;
