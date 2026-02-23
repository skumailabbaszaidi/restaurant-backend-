import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

import orderRoutes from './routes/orderRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import adminRoutes from './routes/adminRoutes';

app.use('/v1/restaurants', restaurantRoutes);
app.use('/v1/orders', orderRoutes);
app.use('/v1/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Restaurant Ordering API is running on Vercel!');
});

// Export the app for Vercel
export default app;

// Listen locally if not in Vercel environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally at http://localhost:${PORT}`);
    console.log(`📂 API Base: http://localhost:${PORT}/v1`);
  });
}

// Global Error Listeners
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
