import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import Interaction from "../../models/Interaction.js";
import User from "../../models/User.js";
import { RessourceInteractionType } from "../../constants/interactions.js";
import { GlobalRole } from "../../constants/roles.js";
import { jest } from "@jest/globals";

describe("Interaction Controller Integration Tests", () => {
  let userToken: string;
  let userId: string;
  let ressourceId: string;
  let testInteractionId: string;

  beforeAll(async () => {
    await User.deleteMany({});
    await Interaction.deleteMany({});

    // 1. Création d'un utilisateur de test
    const userRes = await request(app).post("/api/auth/signup").send({
      firstname: "User",
      lastname: "Interaction",
      email: "inter@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    userToken = userRes.body.token;
    userId = userRes.body.data.user._id;

    // 2. ID de ressource fictif
    ressourceId = new mongoose.Types.ObjectId().toString();

    // 3. Création d'une interaction initiale
    const inter = await Interaction.create({
      UserId: new mongoose.Types.ObjectId(userId),
      interactionType: RessourceInteractionType.VIEW,
      ressourceId: new mongoose.Types.ObjectId(ressourceId),
    });
    testInteractionId = (inter as any)._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/interactions", () => {
    it("doit enregistrer une nouvelle interaction avec succès", async () => {
      const res = await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          interactionType: RessourceInteractionType.FAVORITE,
          ressourceId: ressourceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.interaction.interactionType).toBe(
        RessourceInteractionType.FAVORITE,
      );
    });

    it("doit retourner une 400 si les données sont invalides (ex: type inconnu)", async () => {
      const res = await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          interactionType: "INVALID_TYPE",
          ressourceId: ressourceId,
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/interactions/user", () => {
    it("doit récupérer les interactions de l'utilisateur connecté", async () => {
      const res = await request(app)
        .get("/api/interactions/user")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.results).toBeGreaterThanOrEqual(1);
    });

    it("doit renvoyer une 500 si la récupération crash", async () => {
      const spy = jest.spyOn(Interaction, "find").mockImplementationOnce(() => {
        throw new Error("Find Error");
      });
      const res = await request(app)
        .get("/api/interactions/user")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/interactions/ressource/:id", () => {
    it("doit récupérer les interactions d'une ressource spécifique", async () => {
      const res = await request(app)
        .get(`/api/interactions/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });

    it("doit renvoyer une 500 si la recherche par ressource crash", async () => {
      const spy = jest.spyOn(Interaction, "find").mockImplementationOnce(() => {
        throw new Error("Resource Find Error");
      });
      const res = await request(app)
        .get(`/api/interactions/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("DELETE /api/interactions/:id", () => {
    it("doit supprimer une interaction appartenant à l'utilisateur", async () => {
      const res = await request(app)
        .delete(`/api/interactions/${testInteractionId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Interaction supprimée");
    });

    it("doit retourner une 404 si l'interaction n'existe pas ou n'appartient pas à l'utilisateur", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/interactions/${fakeId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Interaction non trouvée");
    });

    it("doit renvoyer une 500 en cas d'erreur serveur lors de la suppression", async () => {
      const spy = jest
        .spyOn(Interaction, "findOneAndDelete")
        .mockImplementationOnce(() => {
          throw new Error("Delete Error");
        });
      const res = await request(app)
        .delete(`/api/interactions/${testInteractionId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });
});
