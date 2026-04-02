import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import Categorie from "../../models/Categorie.js";
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

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/categories", () => {
    it("doit retourner uniquement les catégories activées", async () => {
      await Categorie.create({ name: "Invisible", systemStatus: "Disabled" });
      const res = await request(app).get("/api/categories");
      expect(res.status).toBe(200);
      const hasDisabled = res.body.data.categories.some(
        (c: any) => c.name === "Invisible",
      );
      expect(hasDisabled).toBe(false);
    });

    it("doit retourner une erreur 500 si la base de données crash", async () => {
      const spy = jest.spyOn(Categorie, "find").mockImplementationOnce(() => {
        throw new Error("Erreur DB");
      });
      const res = await request(app).get("/api/categories");
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/categories/all", () => {
    it("doit permettre à l'admin de voir TOUTES les catégories (même Disabled)", async () => {
      const res = await request(app)
        .get("/api/categories/all")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const hasDisabled = res.body.data.categories.some(
        (c: any) => c.systemStatus === "Disabled",
      );
      expect(hasDisabled).toBe(true);
    });

    it("doit renvoyer une 500 si la base de données crash lors de la récupération admin", async () => {
      const spy = jest.spyOn(Categorie, "find").mockImplementationOnce(() => {
        throw new Error("Simulated DB Crash");
      });
      const res = await request(app)
        .get("/api/categories/all")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/categories/:id", () => {
    it("doit récupérer une catégorie spécifique par son ID", async () => {
      const res = await request(app).get(`/api/categories/${testCategoryId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.category.name).toBe("Santé");
    });

    it("doit retourner une 404 si la catégorie n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/categories/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it("doit retourner une 400 si l'ID fourni est malformé", async () => {
      const res = await request(app).get("/api/categories/id-invalide-123");
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ID invalide/);
    });
  });

  describe("POST /api/categories", () => {
    it("doit permettre à un admin de créer une catégorie", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Technologie" });
      expect(res.status).toBe(201);
      expect(res.body.data.category.name).toBe("Technologie");
    });

    it("doit retourner une 400 si la création échoue (validation)", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({}); // Body vide
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/categories/:id", () => {
    it("doit mettre à jour le nom d'une catégorie", async () => {
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Santé & Bien-être" });
      expect(res.status).toBe(200);
      expect(res.body.data.category.name).toBe("Santé & Bien-être");
    });

    it("doit retourner une 404 si la catégorie à modifier est introuvable", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/categories/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "N'existe pas" });
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 en cas d'erreur Mongoose lors de l'update", async () => {
      const spy = jest
        .spyOn(Categorie, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Simulated Update Error");
        });
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Erreur" });
      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("PATCH /api/categories/:id/disable", () => {
    it("doit désactiver une catégorie avec succès", async () => {
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.category.systemStatus).toBe("Disabled");
    });

    it("doit retourner une 404 si la catégorie à désactiver n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/categories/${fakeId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 si la recherche pour désactivation échoue", async () => {
      const spy = jest
        .spyOn(Categorie, "findById")
        .mockImplementationOnce(() => {
          throw new Error("Simulated Find Error");
        });
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/disable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("PATCH /api/categories/:id/enable", () => {
    it("doit réactiver une catégorie avec succès", async () => {
      await Categorie.findByIdAndUpdate(testCategoryId, {
        systemStatus: "Disabled",
      });

      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.category.systemStatus).toBe("Enabled");
    });

    it("doit renvoyer une 404 si la catégorie n'est pas trouvée (ou déjà active)", async () => {
      // testCategoryId est maintenant 'Enabled', donc enableCategory (qui cherche 'Disabled') doit échouer
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 en cas d'erreur serveur lors de la réactivation", async () => {
      const spy = jest
        .spyOn(Categorie, "findById")
        .mockImplementationOnce(() => {
          throw new Error("Erreur de réactivation simulée");
        });
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/enable`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });
});
