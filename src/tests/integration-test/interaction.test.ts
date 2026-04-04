import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import Interaction from "../../models/Interaction.js";
import InteractionRepository from "../../repositories/interactionRepository.js"; // Import du Repository
import User from "../../models/User.js";
import { RessourceInteractionType } from "../../constants/interactions.js";
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

    // 3. Création d'une interaction initiale via le repository
    const inter = await InteractionRepository.create({
      UserId: new mongoose.Types.ObjectId(userId) as any,
      interactionType: RessourceInteractionType.VIEW,
      ressourceId: new mongoose.Types.ObjectId(ressourceId) as any,
    });
    testInteractionId = (inter as any)._id.toString();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/interactions", () => {
    it("doit enregistrer une nouvelle interaction avec succès via Repository", async () => {
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

    it("doit retourner une 400 si InteractionRepository.create crash (ex: validation)", async () => {
      const spy = jest
        .spyOn(InteractionRepository, "create")
        .mockImplementationOnce(() => {
          throw new Error("Validation Error");
        });

      const res = await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          interactionType: "INVALID",
          ressourceId: ressourceId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation Error");
    });
  });

  describe("GET /api/interactions", () => {
    it("doit récupérer les interactions de l'utilisateur connecté via Repository", async () => {
      const res = await request(app)
        .get("/api/interactions/user")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.results).toBeGreaterThanOrEqual(1);
    });

    it("doit renvoyer une 500 si findByUserId crash", async () => {
      const spy = jest
        .spyOn(InteractionRepository, "findByUserId")
        .mockImplementationOnce(() => {
          throw new Error("Find Error");
        });
      const res = await request(app)
        .get("/api/interactions/user")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Find Error");
    });
  });

  describe("GET /api/interactions/ressource/:id", () => {
    it("doit récupérer les interactions d'une ressource via Repository", async () => {
      const res = await request(app)
        .get(`/api/interactions/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });

    it("doit renvoyer une 500 si findByResourceId crash", async () => {
      const spy = jest
        .spyOn(InteractionRepository, "findByResourceId")
        .mockImplementationOnce(() => {
          throw new Error("Resource Find Error");
        });
      const res = await request(app)
        .get(`/api/interactions/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /api/interactions/:id", () => {
    it("doit supprimer une interaction appartenant à l'utilisateur via Repository", async () => {
      const res = await request(app)
        .delete(`/api/interactions/${testInteractionId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Interaction supprimée");
    });

    it("doit retourner une 404 si le Repository ne trouve pas l'interaction", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/interactions/${fakeId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Interaction non trouvée");
    });

    it("doit renvoyer une 500 si deleteUserInteraction crash", async () => {
      const spy = jest
        .spyOn(InteractionRepository, "deleteUserInteraction")
        .mockImplementationOnce(() => {
          throw new Error("Delete Repository Error");
        });

      const res = await request(app)
        .delete(`/api/interactions/${testInteractionId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Delete Repository Error");
    });
  });
});
