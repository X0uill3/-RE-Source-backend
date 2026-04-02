import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import TypeRelation from "../../models/TypeRelation.js";
import User from "../../models/User.js";
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

    const type = await TypeRelation.create({
      name: "Ami",
      systemStatus: "Enabled",
    });
    testTypeId = type._id.toString();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Sécurité critique pour le coverage
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });
  describe("GET /api/typeRelation", () => {
    it("doit lister uniquement les types de relation actifs (Enabled)", async () => {
      // On crée un type désactivé pour vérifier qu'il est filtré
      await TypeRelation.create({
        name: "Invisible",
        systemStatus: "Disabled",
      });

      const res = await request(app).get("/api/typeRelation");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      // Vérification que le type "Disabled" n'est pas dans la liste
      const hasDisabled = res.body.data.typeRelations.some(
        (t: any) => t.name === "Invisible",
      );
      expect(hasDisabled).toBe(false);
    });

    it("doit renvoyer une erreur 500 si la récupération échoue (catch)", async () => {
      // Mock de la méthode find pour forcer une erreur
      const spy = jest
        .spyOn(TypeRelation, "find")
        .mockImplementationOnce(() => {
          throw new Error("Erreur de base de données simulée");
        });

      const res = await request(app).get("/api/typeRelation");

      expect(res.status).toBe(500);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Erreur de base de données simulée");

      spy.mockRestore();
    });
  });

  describe("GET /api/typeRelation/:id", () => {
    it("doit afficher un type de relation précis", async () => {
      const res = await request(app).get(`/api/typeRelation/${testTypeId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.typeRelation._id).toBe(testTypeId);
    });

    it("doit renvoyer 404 si introuvable", async () => {
      const res = await request(app).get(
        `/api/typeRelation/${new mongoose.Types.ObjectId()}`,
      );
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 si findById crash", async () => {
      jest.spyOn(TypeRelation, "findById").mockImplementationOnce(() => {
        throw new Error("Err");
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
      expect(Array.isArray(res.body.data.typeRelations)).toBe(true);
    });

    it("doit renvoyer 500 si getAllAdmin crash", async () => {
      jest.spyOn(TypeRelation, "find").mockImplementationOnce(() => {
        throw new Error("Crash Admin");
      });
      const res = await request(app)
        .get("/api/typeRelation/all")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/typeRelation", () => {
    it("doit permettre à l'admin de créer un type de relation", async () => {
      const res = await request(app)
        .post("/api/typeRelation")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Famille", description: "Lien de parenté" });
      expect(res.status).toBe(201);
    });

    it("doit renvoyer une 500 si la création crash (ex: nom manquant)", async () => {
      const res = await request(app)
        .post("/api/typeRelation")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({}); // Manque 'name' requis
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /api/typeRelation/:id", () => {
    it("doit permettre à l'admin de mettre à jour un type", async () => {
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Ami Pro" });
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 404 si le type est introuvable ou désactivé", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/typeRelation/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test" });
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 si l'update crash", async () => {
      const spy = jest
        .spyOn(TypeRelation, "findOneAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Crash");
        });
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });

    it("doit renvoyer une 500 (ou 400) si l'ID est malformé", async () => {
      const res = await request(app).get("/api/typeRelation/id-invalide");
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

    it("doit renvoyer 404 si déjà désactivé ou introuvable", async () => {
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 si le disable crash", async () => {
      const spy = jest
        .spyOn(TypeRelation, "findOneAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Crash");
        });
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("PATCH /api/typeRelation/:id/enable", () => {
    it("doit permettre à l'admin de réactiver un type", async () => {
      // On s'assure qu'il est désactivé d'abord (fait par le test précédent)
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

    it("doit renvoyer 500 si le enable crash", async () => {
      const spy = (
        jest.spyOn(TypeRelation, "findOneAndUpdate") as any
      ).mockImplementationOnce(() => {
        throw new Error("Crash");
      });
      const res = await request(app)
        .patch(`/api/typeRelation/${testTypeId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });
});
