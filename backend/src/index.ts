import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import walletRoutes from './routes/walletRoutes';
import rideRoutes from './routes/rideRoutes';
import landmarkRoutes from './routes/landmarkRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import userRoutes from './routes/userRoutes';
import podRoutes from './routes/podRoutes';
import paymentRoutes from './routes/paymentRoutes';
import webhookRoutes from './routes/webhookRoutes';
import prisma from './services/prisma';
import { SocketService } from './services/SocketService';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './utils/redis';
import logger from './utils/logger';

const app = express();
const httpServer = createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000', 
  'http://127.0.0.1:3000', 
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173', 
  'http://127.0.0.1:5173'
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Configure Redis Adapter for horizontal scaling (only if Redis is available)
pubClient.on('connect', () => {
  io.adapter(createAdapter(pubClient, subClient));
  logger.info('Socket.IO Redis adapter enabled');
});

pubClient.on('error', () => {
  logger.warn('Socket.IO Redis adapter disabled (Redis connection failed)');
});

// Initialize Socket Service
new SocketService(io);

const PORT = Number(process.env.PORT) || 3001;

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
}));
app.use(limiter);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/wallet', walletRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/landmarks', landmarkRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/pods', podRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/webhooks', webhookRoutes);

app.get(['/health', '/api/health'], async (req, res) => {
  let dbStatus = 'Unknown';
  let redisStatus = 'Unknown';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'Connected';
  } catch (e) {
    dbStatus = 'Disconnected';
  }

  try {
    const redis = (await import('./utils/redis')).default;
    redisStatus = redis.status === 'ready' ? 'Connected' : 'Disconnected';
  } catch (e) {
    redisStatus = 'Error';
  }

  res.json({
    status: dbStatus === 'Connected' ? 'OK' : 'Degraded',
    message: 'CommuteShare GH API with Real-time Support is running',
    dependencies: {
      database: dbStatus,
      redis: redisStatus,
    }
  });
});

// Catch-all 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Path ${req.originalUrl} not found` });
});

export { app, httpServer };

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`Server is successfully running on port ${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', { error: err });
  process.exit(1);
});

process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', { error: err });
  process.exit(1);
});
