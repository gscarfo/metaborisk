import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import handlers with explicit extensions for NodeNext compatibility
import authHandler from './api/auth.js';
import patientsHandler from './api/patients.js';
import adminHandler from './api/admin.js';
import initHandler from './api/init.js';
import aiHandler from './api/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.all('/api/auth', (req, res) => authHandler(req, res));
app.all('/api/patients', (req, res) => patientsHandler(req, res));
app.all('/api/admin', (req, res) => adminHandler(req, res));
app.all('/api/init', (req, res) => initHandler(req, res));
app.all('/api/ai', (req, res) => aiHandler(req, res));

// Serve Static Files (Frontend)
app.use(express.static(__dirname));

// Catch-all route to serve index.html for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});