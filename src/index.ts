import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import surveyRoutes from './routes/surveys';
import responseRoutes from './routes/responses';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // Allow the frontend origin from env; in development reflect origin to support ports like 3001
    origin: process.env.FRONTEND_URL || true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Use a permissive origin during development so cookies and auth headers work across ports
app.use(cors({ 
  origin: process.env.FRONTEND_URL || true, 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting - more generous for development
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/responses', responseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SurveyForge Backend is running' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('joinSurvey', (surveyId) => {
    socket.join(surveyId);
    console.log(`Socket ${socket.id} joined survey ${surveyId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';

server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`⚠️  Port ${PORT} is already in use!`);
  }
});

server.listen(Number(PORT), HOST, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Server address: http://${HOST}:${PORT}`);
  console.log(`🔍 Health check: http://${HOST}:${PORT}/api/health`);
  // Connect to MongoDB in background
  connectDB();
});

// Export io for use in controllers
export { io };
