import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';

import { GameEngine } from './game/GameEngine';
import { setupSocketHandlers } from './socket/handlers';
import { createAuthRouter } from './routes/auth';
import { createRoomsRouter } from './routes/rooms';
import { createUsersRouter } from './routes/users';

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('✅ Firebase Admin initialized');

// ─── Prisma ───────────────────────────────────────────────────────────────────
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [clientUrl, /localhost:\d+/],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [clientUrl, /localhost:\d+/],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ─── Game Engine ──────────────────────────────────────────────────────────────
const engine = new GameEngine(io, prisma);
setupSocketHandlers(io, prisma, engine);

// ─── REST Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', createAuthRouter(prisma));
app.use('/api/rooms', createRoomsRouter(prisma));
app.use('/api/users', createUsersRouter(prisma));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);

httpServer.listen(PORT, () => {
  console.log(`🚀 Guess 11 server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { app, io, prisma };
