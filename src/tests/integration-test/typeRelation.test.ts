import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import TypeRelation from "../../models/TypeRelation.js";
import User from "../../models/User.js";
import TypeRelationRepository from "../../repositories/typeRelationRepository.js"; // Import du Repository
import { GlobalRole } from "../../constants/roles.js";
import { jest } from "@jest/globals";

describe("TypeRelation Controller Integration Tests", () => {
  let adminToken: string;
  let testTypeId: string;

  beforeAll(async () => {
    await User.deleteMany({});
    await TypeRelation.deleteMany({});

    const adminRes = await request(app).post("/api/auth/signup").send({
      firstname: "Admin",
      lastname: "Type",
      email: "admin.type@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    await User.findByIdAndUpdate(adminRes.body.data.user._id, {
      role: GlobalRole.ADMIN,
    });
    adminToken = adminRes.body.token;

    // Création initiale pour les tests via Repository
    const type = await TypeRelationRepository.create({
      name: "Ami",
      systemStatus: "Enabled",
    });
    testTypeId = type._id.toString();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Nettoie les mocks entre chaque test
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/typeRelation", () => {
    it("doit lister uniquement les types de relation actifs (Enabled)", async () => {
      await TypeRelationRepository.create({
        name: "Invisible",
        systemStatus: "Disabled",
      });

      const res = await request(app).get("/api/typeRelation");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      const hasDisabled = res.body.data.typeRelations.some(
        (t: any) => t.name === "Invisible",
      );
      expect(hasDisabled).toBe(false);
    });

    it("doit renvoyer une erreur 500 si Repository.findAll crash", async () => {
      const spy = jest
        .spyOn(TypeRelationRepository, "findAll")
        .mockImplementationOnce(() => {
          throw new Error("Erreur Repository");
        });

      const res = await request(app).get("/api/typeRelation");

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Erreur Repository");
    });
  });

  describe("GET /api/typeRelation/:id", () => {
    it("doit afficher un type de relation précis", async () => {
      const res = await request(app).get(`/api/typeRelation/${testTypeId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.typeRelation._id).toBe(testTypeId);
    });

    it("doit renvoyer 404 si le Repository retourne null", async () => {
      const res = await request(app).get(
        `/api/typeRelation/${new mongoose.Types.ObjectId()}`,
      );
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 si Repository.findById crash", async () => {
      jest
        .spyOn(TypeRelationRepository, "findById")
        .mockImplementationOnce(() => {
          throw new Error("Crash findById");
        });
      const res = await request(app).get(`/api/typeRelation/${testTypeId}`);
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/typeRelation/all", () => {
    it("doit permettre à l'admin de lister tous les types", async () => {
      const res = await request(app)
        .get("/api/typeRelation/all")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si Repository.findAll crash pour Admin", async () => {
      jest
        .spyOn(TypeRelationRepository, "findAll")
        .mockImplementationOnce(() => {
          throw new Error("Crash Admin Repo");
        });
      const res = await request(app)
        .get("/api/typeRelation/all")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/typeRelation", () => {
    it("doit permettre à l'admin de créer un type", async () => {
      const res = await request(app)
        .post("/api/typeRelation")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Famille", description: "Lien de parenté" });
      expect(res.status).toBe(201);
      expect(res.body.data.typeRelation.name).toBe("Famille");
    });

    it("doit renvoyer 500 si Repository.create crash", async () => {
      const spy = jest
        .spyOn(TypeRelationRepository, "create")
        .mockImplementationOnce(() => {
          throw new Error("Create Fail");
        });
      const res = await request(app)
        .post("/api/typeRelation")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Error" });
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /api/typeRelation/:id", () => {
    it("doit permettre de mettre à jour via Repository.findOneAndUpdateByStatus", async () => {
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Ami Pro" });
      expect(res.status).toBe(200);
      expect(res.body.data.typeRelation.name).toBe("Ami Pro");
    });

    it("doit renvoyer 404 si le repository ne trouve pas le document actif", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/typeRelation/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" });
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 si Repository.findOneAndUpdateByStatus crash", async () => {
      jest
        .spyOn(TypeRelationRepository, "findOneAndUpdateByStatus")
        .mockImplementationOnce(() => {
          throw new Error("Crash Update");
        });
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /api/typeRelation/:id/disable", () => {
    it("doit permettre à l'admin de désactiver un type", async () => {
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 404 si Repository retourne null (déjà désactivé)", async () => {
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/typeRelation/:id/enable", () => {
    it("doit permettre à l'admin de réactiver un type", async () => {
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 404 si déjà activé ou introuvable", async () => {
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
