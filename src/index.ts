import express from 'express';
// En mode 'verbatimModuleSyntax', on sépare bien les types
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import articlesRoutes from './routes/articlesRoutes.js';
import diaryRoutes from './routes/diaryRoutes.js';
import emotionRoutes from './routes/emotionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import logRoutes from './routes/logRoutes.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';

dotenv.config();
connectDB();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/diagnostic', diagnosticRoutes);

// Ajoute bien les types ici pour que res.send() soit reconnu
app.get('/', (req: Request, res: Response) => {
    res.send('API CESIZen opérationnelle 🧘');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
});