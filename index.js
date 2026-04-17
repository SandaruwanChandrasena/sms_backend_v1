import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Load .env variables before anything else
  dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Allow frontend to communicate with backend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static('uploads'));


// add after your existing app.use() lines
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/submissions',   submissionRoutes);

// Health check route — confirms API is running
app.get('/', (req, res) => {
  res.json({ message: 'SMS API is running' });
});

// add as the very last line before app.listen
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));