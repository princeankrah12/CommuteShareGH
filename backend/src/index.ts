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
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import userRoutes from './routes/userRoutes';
import podRoutes from './routes/podRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import webhookRoutes from './routes/webhookRoutes';
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
app.use(express.json());

app.use('/api/wallet', walletRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/pods', podRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/webhooks', webhookRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CommuteShare GH API with Real-time Support is running' });
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
