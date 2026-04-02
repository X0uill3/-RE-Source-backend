import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  // 1. Fermer toute connexion existante au cas où
  await mongoose.disconnect();

  // 2. Lancer le serveur en mémoire
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  // 3. Se connecter avec des options de sécurité
  await mongoose.connect(uri);
}, 30000); // Timeout long pour le premier téléchargement

afterAll(async () => {
  if (mongo) {
    // On vérifie si la connexion est bien ouverte (readyState 1)
    // avant de tenter un dropDatabase
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }

    // On ferme la connexion Mongoose
    await mongoose.connection.close();
    // On arrête le serveur binaire MongoDB
    await mongo.stop();
  }
});
