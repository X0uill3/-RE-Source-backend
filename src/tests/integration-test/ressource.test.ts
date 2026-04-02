import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import Resource from "../../models/Ressource.js";
import User from "../../models/User.js";
import Categorie from "../../models/Categorie.js";
import { GlobalRole } from "../../constants/roles.js";
import { GlobalTypeRessource } from "../../constants/typeRessource.js";
import { jest } from "@jest/globals";

describe("Resource Controller Integration Tests", () => {
  let adminToken: string;
  let userToken: string;
  let otherUserToken: string;
  let userId: string;
  let categoryId: string;
  let publicResourceId: string;
  let disabledResourceId: string;

  beforeAll(async () => {
    await User.deleteMany({});
    await Resource.deleteMany({});
    await Categorie.deleteMany({});

    // 1. Setup Utilisateurs
    const adminRes = await request(app).post("/api/auth/signup").send({
      firstname: "Admin",
      lastname: "Res",
      email: "admin.res@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    await User.findByIdAndUpdate(adminRes.body.data.user._id, {
      role: GlobalRole.ADMIN,
    });
    adminToken = adminRes.body.token;

    const userRes = await request(app).post("/api/auth/signup").send({
      firstname: "User",
      lastname: "Res",
      email: "user.res@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    userToken = userRes.body.token;
    userId = userRes.body.data.user._id;

    const otherRes = await request(app).post("/api/auth/signup").send({
      firstname: "Other",
      lastname: "Res",
      email: "other.res@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    otherUserToken = otherRes.body.token;

    // 2. Setup Catégorie
    const cat = await Categorie.create({
      name: "Formation",
      systemStatus: "Enabled",
    });
    categoryId = cat._id.toString();

    // 3. Setup Ressources
    const res1 = await Resource.create({
      title: "Ressource Publique",
      description: "Desc",
      userId: userId,
      categorie: categoryId,
      systemStatus: "Enabled",
      visibility: "Public",
      typeRessource: GlobalTypeRessource.GAME,
    });
    publicResourceId = res1._id.toString();

    const res2 = await Resource.create({
      title: "Ressource En Attente",
      description: "Desc",
      userId: userId,
      categorie: categoryId,
      systemStatus: "Disabled",
      visibility: "Public",
      typeRessource: GlobalTypeRessource.GAME,
    });
    disabledResourceId = res2._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/resources", () => {
    it("doit lister les ressources publiques activées", async () => {
      const res = await request(app).get("/api/resources");
      expect(res.status).toBe(200);
      expect(
        res.body.data.resources.every((r: any) => r.systemStatus === "Enabled"),
      ).toBe(true);
    });

    it("doit filtrer les ressources par catégorie", async () => {
      const res = await request(app).get(
        `/api/resources?categorie=${categoryId}`,
      );
      expect(res.status).toBe(200);
    });

    it("doit filtrer les ressources par type de ressource (Query)", async () => {
      const res = await request(app).get(
        `/api/resources?typeRessource=${GlobalTypeRessource.GAME}`,
      );

      expect(res.status).toBe(200);
      // On vérifie que la ressource retournée a bien le bon type
      const allMatch = res.body.data.resources.every(
        (r: any) => r.typeRessource === GlobalTypeRessource.GAME,
      );
      expect(allMatch).toBe(true);
    });

    it("doit filtrer les ressources par type de relation (Query)", async () => {
      const fakeRelationId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(
        `/api/resources?typeRelation=${fakeRelationId}`,
      );

      expect(res.status).toBe(200);
      // Même si le résultat est vide (0 ressources), la ligne de code est exécutée
      expect(Array.isArray(res.body.data.resources)).toBe(true);
    });

    it("doit renvoyer 500 si la base de données crash", async () => {
      const spy = jest.spyOn(Resource, "find").mockImplementationOnce(() => {
        throw new Error("Crash find");
      });
      const res = await request(app).get("/api/resources");
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/resources/restricted", () => {
    it("doit lister toutes les ressources activées pour un citoyen connecté", async () => {
      const res = await request(app)
        .get("/api/resources/restricted")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si la récupération restreinte crash", async () => {
      const spy = jest.spyOn(Resource, "find").mockImplementationOnce(() => {
        throw new Error("Crash");
      });
      const res = await request(app)
        .get("/api/resources/restricted")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/resources/:id", () => {
    it("doit afficher une ressource et incrémenter les vues", async () => {
      const res = await request(app).get(`/api/resources/${publicResourceId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.resource.views).toBeGreaterThan(0);
    });

    it("doit renvoyer 404 si la ressource n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/resources/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 en cas d'erreur serveur sur le findById", async () => {
      const spy = jest
        .spyOn(Resource, "findById")
        .mockImplementationOnce(() => {
          throw new Error("Crash");
        });
      const res = await request(app).get(`/api/resources/${publicResourceId}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("POST /api/resources", () => {
    it("doit créer une ressource en statut 'Disabled' pour un citoyen", async () => {
      const res = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "New",
          description: "Desc",
          typeRessource: GlobalTypeRessource.GAME,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.resource.systemStatus).toBe("Disabled");
    });

    it("doit créer une ressource en statut 'Enabled' pour un admin", async () => {
      const res = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Admin Res",
          description: "Desc",
          typeRessource: GlobalTypeRessource.GAME,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.resource.systemStatus).toBe("Enabled");
    });

    it("doit renvoyer 400 si la création échoue (validation)", async () => {
      const res = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${userToken}`)
        .send({}); // Title manquant
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/resources/:id", () => {
    it("doit permettre à l'auteur de modifier sa ressource (et la repasser en Disabled)", async () => {
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Titre Modifié" });
      expect(res.status).toBe(200);
      expect(res.body.data.resource.systemStatus).toBe("Disabled");
    });

    it("doit refuser la modification par un autre utilisateur (403)", async () => {
      const res = await request(app)
        .patch(`/api/resources/${disabledResourceId}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ title: "Hacker" });
      expect(res.status).toBe(403);
    });

    it("doit renvoyer 404 si la ressource à modifier n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/resources/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 si la mise à jour finale (findByIdAndUpdate) échoue", async () => {
      // On mocke findById pour que l'autorisation passe, mais findByIdAndUpdate pour que le catch soit activé
      const spy = jest
        .spyOn(Resource, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Final Update Crash");
        });
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Retry" });

      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("PATCH /api/resources/:id/validate", () => {
    it("doit permettre à l'admin de valider une ressource", async () => {
      const res = await request(app)
        .patch(`/api/resources/${disabledResourceId}/validate`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.resource.systemStatus).toBe("Enabled");
    });

    it("doit renvoyer 404 si la ressource à valider n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/resources/${fakeId}/validate`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 si la validation échoue à cause d'une erreur serveur", async () => {
      const spy = jest
        .spyOn(Resource, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Validation Crash");
        });
      const res = await request(app)
        .patch(`/api/resources/${disabledResourceId}/validate`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("DELETE /api/resources/:id", () => {
    it("doit suspendre une ressource (passer en Disabled) par l'admin", async () => {
      const res = await request(app)
        .delete(`/api/resources/${publicResourceId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
      const updated = await Resource.findById(publicResourceId);
      expect(updated?.systemStatus).toBe("Disabled");
    });
    it("doit renvoyer une 404 si la ressource à supprimer n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/resources/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 si la suppression (suspension) crash", async () => {
      const spy = jest
        .spyOn(Resource, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Delete Crash");
        });
      const res = await request(app)
        .delete(`/api/resources/${publicResourceId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("PATCH /api/resources/:id/start", () => {
    it("doit démarrer une ressource de type GAME", async () => {
      const res = await request(app)
        .patch(`/api/resources/${disabledResourceId}/start`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.resource.start).toBe(true);
    });

    it("doit refuser de démarrer une ressource qui n'est pas GAME ou ACTIVITY", async () => {
      const mockedResource = {
        _id: categoryId,
        typeRessource: "ARTICLE",
      };

      const spy = jest.spyOn(Resource, "findById") as any;

      spy.mockImplementationOnce(() => Promise.resolve(mockedResource));

      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}/start`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ne peut pas être démarrée/);

      spy.mockRestore();
    });

    it("doit renvoyer 404 si la ressource à démarrer n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/resources/${fakeId}/start`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 500 si le démarrage de la ressource provoque une erreur serveur", async () => {
      const spy = jest
        .spyOn(Resource, "findById")
        .mockImplementationOnce(() => {
          throw new Error("Start Crash");
        });
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}/start`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/resources/popular", () => {
    beforeAll(async () => {
      // On s'assure d'avoir plusieurs ressources avec des nombres de vues différents
      await Resource.create([
        {
          title: "Pop 1",
          description: "Desc",
          userId: userId,
          categorie: categoryId,
          systemStatus: "Enabled",
          visibility: "Public",
          typeRessource: GlobalTypeRessource.GAME,
          views: 100,
        },
        {
          title: "Pop 2",
          description: "Desc",
          userId: userId,
          categorie: categoryId,
          systemStatus: "Enabled",
          visibility: "Public",
          typeRessource: GlobalTypeRessource.GAME,
          views: 500,
        },
      ]);
    });

    it("doit lister les ressources les plus populaires (triées par vues décroissantes)", async () => {
      const res = await request(app).get("/api/resources/popular");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data.resources)).toBe(true);

      // Vérification du tri : la première ressource doit avoir plus de vues que la seconde
      const resources = res.body.data.resources;
      if (resources.length >= 2) {
        expect(resources[0].views).toBeGreaterThanOrEqual(resources[1].views);
      }
    });

    it("doit respecter le paramètre de limite s'il est fourni", async () => {
      const limit = 1;
      const res = await request(app).get(
        `/api/resources/popular?limit=${limit}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.resources.length).toBeLessThanOrEqual(limit);
    });

    it("doit renvoyer 500 si la récupération des populaires crash (catch)", async () => {
      // On mock la méthode find de Resource
      const spy = jest.spyOn(Resource, "find").mockImplementationOnce(() => {
        return {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockImplementationOnce(() => {
            throw new Error("Popular Crash");
          }),
        } as any;
      });

      const res = await request(app).get("/api/resources/popular");

      expect(res.status).toBe(500);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Popular Crash");

      spy.mockRestore();
    });
  });
});
