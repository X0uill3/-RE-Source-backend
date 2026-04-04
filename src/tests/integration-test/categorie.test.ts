import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import Categorie from "../../models/Categorie.js";
import CategorieRepository from "../../repositories/categorieRepository.js"; // Import du Repository
import User from "../../models/User.js";
import { GlobalRole } from "../../constants/roles.js";
import { jest } from "@jest/globals";

describe("Categorie Controller Integration Tests", () => {
  let adminToken: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await User.deleteMany({});
    await Categorie.deleteMany({});

    const adminRes = await request(app).post("/api/auth/signup").send({
      firstname: "Admin",
      lastname: "System",
      email: "admin@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });

    await User.findByIdAndUpdate(adminRes.body.data.user._id, {
      role: GlobalRole.ADMIN,
    });
    adminToken = adminRes.body.token;

    const cat = await Categorie.create({
      name: "Santé",
      systemStatus: "Enabled",
    });
    testCategoryId = cat._id.toString();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/categories", () => {
    it("doit retourner uniquement les catégories activées via Repository", async () => {
      await Categorie.create({ name: "Invisible", systemStatus: "Disabled" });
      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(200);
      const hasDisabled = res.body.data.categories.some(
        (c: any) => c.name === "Invisible",
      );
      expect(hasDisabled).toBe(false);
    });

    it("doit retourner une erreur 500 si CategorieRepository.findAll crash", async () => {
      const spy = jest
        .spyOn(CategorieRepository, "findAll")
        .mockImplementationOnce(() => {
          throw new Error("Erreur Repository");
        });
      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Erreur Repository");
    });
  });

  describe("GET /api/categories/all", () => {
    it("doit permettre à l'admin de voir toutes les catégories", async () => {
      const res = await request(app)
        .get("/api/categories/all")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const hasDisabled = res.body.data.categories.some(
        (c: any) => c.systemStatus === "Disabled",
      );
      expect(hasDisabled).toBe(true);
    });

    it("doit retourner une erreur 500 si CategorieRepository.findAll crash (pour les admins)", async () => {
      const spy = jest
        .spyOn(CategorieRepository, "findAll")
        .mockImplementationOnce(() => {
          throw new Error("Erreur Repository Admin");
        });
      const res = await request(app)
        .get("/api/categories/all")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Erreur Repository Admin");
      spy.mockRestore();
    });
  });

  describe("GET /api/categories/:id", () => {
    it("doit récupérer une catégorie spécifique via Repository", async () => {
      const res = await request(app).get(`/api/categories/${testCategoryId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.category.name).toBe("Santé");
    });

    it("doit retourner une 404 si le Repository ne trouve rien", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/categories/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it("doit retourner une 400 en cas de crash lors de findByIdAndStatus", async () => {
      const spy = jest
        .spyOn(CategorieRepository, "findByIdAndStatus")
        .mockImplementationOnce(() => {
          throw new Error("Crash ID");
        });
      const res = await request(app).get(`/api/categories/${testCategoryId}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ID invalide ou erreur serveur");
    });
  });

  describe("POST /api/categories", () => {
    it("doit permettre à un admin de créer une catégorie via Repository", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Technologie" });

      expect(res.status).toBe(201);
      expect(res.body.data.category.name).toBe("Technologie");
    });

    it("doit retourner une 400 si CategorieRepository.create crash", async () => {
      const spy = jest
        .spyOn(CategorieRepository, "create")
        .mockImplementationOnce(() => {
          throw new Error("Validation Error");
        });
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Fail" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/categories/:id", () => {
    it("doit mettre à jour une catégorie via Repository", async () => {
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Santé & Bien-être" });

      expect(res.status).toBe(200);
      expect(res.body.data.category.name).toBe("Santé & Bien-être");
    });

    it("doit renvoyer une 400 si CategorieRepository.update crash", async () => {
      const spy = jest
        .spyOn(CategorieRepository, "update")
        .mockImplementationOnce(() => {
          throw new Error("Update Error");
        });
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Erreur" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/categories/:id/disable", () => {
    it("doit désactiver une catégorie via Repository.save", async () => {
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.category.systemStatus).toBe("Disabled");
    });

    it("doit renvoyer une 400 si le save dans le repository crash", async () => {
      const spy = jest
        .spyOn(CategorieRepository, "save")
        .mockImplementationOnce(() => {
          throw new Error("Save Error");
        });
      // On s'assure qu'elle est "Enabled" avant de tenter le disable
      await Categorie.findByIdAndUpdate(testCategoryId, {
        systemStatus: "Enabled",
      });

      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/categories/:id/enable", () => {
    it("doit réactiver une catégorie via Repository.save", async () => {
      // Préparation : on s'assure qu'elle est désactivée
      await Categorie.findByIdAndUpdate(testCategoryId, {
        systemStatus: "Disabled",
      });

      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.category.systemStatus).toBe("Enabled");
    });

    it("doit renvoyer une 404 si la catégorie n'est pas en statut 'Disabled'", async () => {
      // testCategoryId est déjà 'Enabled' suite au test précédent
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 si findByIdAndStatus crash au moment de l'activation", async () => {
      const spy = jest
        .spyOn(CategorieRepository, "findByIdAndStatus")
        .mockImplementationOnce(() => {
          throw new Error("Find Error");
        });
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});
