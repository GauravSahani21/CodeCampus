import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectDB } from './utils/db';
import authRoutes from './routes/auth.routes';
import problemRoutes from './routes/problem.routes';
import submissionRoutes from './routes/submission.routes';
import executeRoutes from './routes/execute.routes';
import userRoutes from './routes/user.routes';
import learnRoutes from './routes/learn.routes';
import instructorRoutes from './routes/instructor.routes';
import contestRoutes from './routes/contest.routes';
import adminRoutes from './routes/admin.routes';
import discussionRoutes from './routes/discussion.routes';
import assignmentRoutes from './routes/assignment.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/error.middleware';
import rateLimit from 'express-rate-limit';
import { registerVersusHandler } from './sockets/versusHandler';
import { registerTerminalHandler } from './sockets/terminalHandler';

import path from 'path';
import next from 'next';

dotenv.config();

const app = express();
// When running behind a proxy (Render, Heroku, etc.) enable trust proxy
// so Express and middleware like rate-limit read the originating IP from
// the `X-Forwarded-For` header.
app.set('trust proxy', 1);
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const dev = process.env.NODE_ENV !== 'production';

// ─── Connect DB ───────────────────────────────────────────────────────────
connectDB();

// ─── Socket.IO Setup ──────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5000',
];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  path: '/socket.io',
});

// JWT auth middleware for Socket.IO (guests allowed with userId = guest_<socketId>)
io.use((socket, next) => {
  const token =
    (socket.handshake.auth as { token?: string })?.token ??
    (socket.handshake.query?.token as string | undefined);

  if (!token) {
    (socket as unknown as Record<string, unknown>).userId = `guest_${socket.id}`;
    (socket as unknown as Record<string, unknown>).username = 'Guest';
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      username: string;
      role: string;
    };
    (socket as unknown as Record<string, unknown>).userId = decoded.id;
    (socket as unknown as Record<string, unknown>).username = decoded.username;
    next();
  } catch {
    // Invalid token — still allow as guest
    (socket as unknown as Record<string, unknown>).userId = `guest_${socket.id}`;
    (socket as unknown as Record<string, unknown>).username = 'Guest';
    next();
  }
});

io.on('connection', (socket) => {
  registerVersusHandler(io, socket);
  registerTerminalHandler(io, socket);
});

// ─── Next.js Setup ────────────────────────────────────────────────────────
const nextApp = next({ dev, dir: path.join(__dirname, '../../client') });
const handle = nextApp.getRequestHandler();

// ─── Express Middleware ───────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.startsWith('http://192.168.')) {
        callback(null, true);
      } else {
        // Permissive for now — tighten in production via CLIENT_URL
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// ─── Rate Limiting ────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // much higher limit for dev
  message: { error: 'Too many requests from this IP, please try again later.' },
});

const executeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
  message: { error: 'Too many execution requests, slow down!' },
});
app.use('/api', limiter);
app.use('/api/execute', executeLimiter);
app.use('/api/submissions', executeLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req: Request, res: Response) =>
  res.json({ status: 'OK', uptime: process.uptime() })
);

app.use(errorHandler);

// ─── Production: Next.js handles all remaining routes ────────────────────
if (!dev) {
  app.use((req: Request, res: Response) => {
    return handle(req as unknown as Parameters<typeof handle>[0], res as unknown as Parameters<typeof handle>[1]);
  });
}

// ─── Start Server ─────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    if (!dev) {
      console.log('⏳ Preparing Next.js...');
      await nextApp.prepare();
      console.log('✅ Next.js prepared');
    }

    server.listen(PORT as number, '0.0.0.0', () => {
      console.log(`🚀 CodeCampus combined server running on port ${PORT}`);
      if (dev) {
        console.log(`📡 API available at http://localhost:${PORT}/api`);
        console.log(`🔌 Socket.IO available at http://localhost:${PORT}/socket.io`);
      } else {
        console.log(`🌍 App available at port ${PORT}`);
      }
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

startServer();

export default app;
