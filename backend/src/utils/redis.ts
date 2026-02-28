import Redis from 'ioredis';
import logger from './logger';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

const redisConfig = {
  host: redisHost,
  port: redisPort,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const redis = new Redis(redisConfig);

let connectionErrorLogged = false;

redis.on('error', (err) => {
  if (!connectionErrorLogged) {
    logger.error('Redis connection error (Initial failure):', err);
    logger.warn('System will continue using IN-MEMORY fallbacks where applicable.');
    connectionErrorLogged = true;
  }
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
  connectionErrorLogged = false;
});

// Clients for Socket.io Redis Adapter
export const pubClient = new Redis(redisConfig);
export const subClient = pubClient.duplicate();

// Add error handlers to prevent crashes and suppress noise
pubClient.on('error', (err) => { /* Silenced */ });
subClient.on('error', (err) => { /* Silenced */ });

export default redis;
