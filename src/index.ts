import express from "express";
// En mode 'verbatimModuleSyntax', on sépare bien les types
import type { Application, Request, Response } from "express";
import cors from "cors";
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

// Ajoute bien les types ici pour que res.send() soit reconnu
app.get("/", (req: Request, res: Response) => {
  res.send("API Ressource Backend est en cours d'exécution");
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  connectDB();
  app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
  });
}

export default app; // Export de l'app pour les tests d'intégration
