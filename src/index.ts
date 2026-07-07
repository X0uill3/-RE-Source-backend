import express from "express";
// En mode 'verbatimModuleSyntax', on sépare bien les types
import type { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import * as dotenv from "dotenv";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import categorieRoutes from "./routes/categorieRoutes.js";
import typeRelationRoutes from "./routes/typeRelationRoutes.js";
import ressourceRoutes from "./routes/ressourceRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import interactionRoutes from "./routes/interactionRoutes.js";
import { protect, softProtect } from "./middleware/authMiddleware.js";

dotenv.config();

const app: Application = express();

app.use(helmet({ crossOriginEmbedderPolicy: true }));
app.use((req: Request, res: Response, next) => {
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  next();
});
app.use(cors());
app.use(express.json());

app.use(softProtect);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/typeRelation", typeRelationRoutes);
app.use("/api/resources", ressourceRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/interactions", interactionRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("API Ressource Backend est en cours d'exécution");
});

app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  connectDB();
  app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
  });
}

export default app; // Export de l'app pour les tests d'intégration
