import express from 'express';
// En mode 'verbatimModuleSyntax', on sépare bien les types
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import connectDB from './config/db.js';

import userRoutes from './routes/userRoutes.js';


dotenv.config();
connectDB();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

// Ajoute bien les types ici pour que res.send() soit reconnu
app.get('/', (req: Request, res: Response) => {
    res.send('API Ressource Backend est en cours d\'exécution');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
});