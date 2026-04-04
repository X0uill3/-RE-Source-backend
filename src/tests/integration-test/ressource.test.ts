import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import Resource from "../../models/Ressource.js";
import ResourceRepository from "../../repositories/ressourceRepository.js";
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
      userId: new mongoose.Types.ObjectId(userId),
      categorie: new mongoose.Types.ObjectId(categoryId),
      systemStatus: "Enabled",
      visibility: "Public",
      typeRessource: GlobalTypeRessource.GAME,
    });
    publicResourceId = res1._id.toString();

    const res2 = await Resource.create({
      title: "Ressource En Attente",
      description: "Desc",
      userId: new mongoose.Types.ObjectId(userId),
      categorie: new mongoose.Types.ObjectId(categoryId),
      systemStatus: "Disabled",
      visibility: "Public",
      typeRessource: GlobalTypeRessource.GAME,
    });
    disabledResourceId = res2._id.toString();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/resources", () => {
    it("doit lister les ressources publiques activées via Repository", async () => {
      const res = await request(app).get("/api/resources");
      expect(res.status).toBe(200);
      expect(
        res.body.data.resources.every((r: any) => r.systemStatus === "Enabled"),
      ).toBe(true);
    });

    it("doit appliquer tous les filtres simultanément (categorie, typeRessource, typeRelation)", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(
        `/api/resources?categorie=${categoryId}&typeRessource=${GlobalTypeRessource.GAME}&typeRelation=${fakeId}&sort=title`,
      );
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });

    it("doit renvoyer 500 si ResourceRepository.findAll crash", async () => {
      jest
        .spyOn(ResourceRepository, "findAll")
        .mockRejectedValueOnce(new Error("FindAll Crash"));
      const res = await request(app).get("/api/resources");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/resources/restricted", () => {
    it("doit lister les ressources restreintes via Repository", async () => {
      const res = await request(app)
        .get("/api/resources/restricted")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si le repository crash sur restricted", async () => {
      jest
        .spyOn(ResourceRepository, "findAll")
        .mockRejectedValueOnce(new Error("Restricted Error"));
      const res = await request(app)
        .get("/api/resources/restricted")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/resources/popular", () => {
    it("doit respecter le paramètre de limite", async () => {
      const res = await request(app).get("/api/resources/popular?limit=5");
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si findPopular crash", async () => {
      jest
        .spyOn(ResourceRepository, "findPopular")
        .mockRejectedValueOnce(new Error("Popular Crash"));
      const res = await request(app).get("/api/resources/popular");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/resources/:id", () => {
    it("doit afficher une ressource et incrémenter les vues", async () => {
      const res = await request(app).get(`/api/resources/${publicResourceId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.resource.views).toBeGreaterThan(0);
    });

    it("doit renvoyer 404 si le repository ne trouve pas l'ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/resources/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 si save crash", async () => {
      jest
        .spyOn(ResourceRepository, "save")
        .mockRejectedValueOnce(new Error("Save Error"));
      const res = await request(app).get(`/api/resources/${publicResourceId}`);
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/resources", () => {
    it("doit créer une ressource via ResourceRepository.create", async () => {
      const res = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "New",
          description: "Desc",
          typeRessource: GlobalTypeRessource.GAME,
        });
      expect(res.status).toBe(201);
    });

    it("doit renvoyer 400 si ResourceRepository.create crash", async () => {
      jest
        .spyOn(ResourceRepository, "create")
        .mockRejectedValueOnce(new Error("Validation Error"));
      const res = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Fail" });
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/resources/:id", () => {
    it("doit permettre à l'auteur de modifier sa ressource", async () => {
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Titre Modifié" });
      expect(res.status).toBe(200);
      expect(res.body.data.resource.systemStatus).toBe("Disabled");
    });

    it("doit renvoyer 403 si l'utilisateur n'est pas l'auteur", async () => {
      const res = await request(app)
        .patch(`/api/resources/${disabledResourceId}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ title: "Hack" });
      expect(res.status).toBe(403);
    });

    it("doit renvoyer 404 si la ressource à modifier n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/resources/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 400 si ResourceRepository.update crash", async () => {
      jest
        .spyOn(ResourceRepository, "update")
        .mockRejectedValueOnce(new Error("Update Crash"));
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Retry" });
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/resources/:id/validate", () => {
    it("doit valider une ressource via Repository.update", async () => {
      const res = await request(app)
        .patch(`/api/resources/${disabledResourceId}/validate`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 404 si la ressource à valider n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/resources/${fakeId}/validate`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 400 si update crash", async () => {
      jest
        .spyOn(ResourceRepository, "update")
        .mockRejectedValueOnce(new Error("Crash"));
      const res = await request(app)
        .patch(`/api/resources/${disabledResourceId}/validate`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/resources/:id", () => {
    it("doit suspendre une ressource", async () => {
      const res = await request(app)
        .delete(`/api/resources/${publicResourceId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });

    it("doit renvoyer 404 si n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/resources/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 400 si crash", async () => {
      jest
        .spyOn(ResourceRepository, "update")
        .mockRejectedValueOnce(new Error("Err"));
      const res = await request(app)
        .delete(`/api/resources/${publicResourceId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/resources/:id/start", () => {
    it("doit démarrer une ressource supportée", async () => {
      const res = await request(app)
        .patch(`/api/resources/${disabledResourceId}/start`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("doit refuser de démarrer un type non supporté (ex: ARTICLE)", async () => {
      jest.spyOn(ResourceRepository, "findById").mockResolvedValueOnce({
        typeRessource: "ARTICLE",
      } as any);
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}/start`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(400);
    });

    it("doit renvoyer 404 si n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/resources/${fakeId}/start`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 si crash", async () => {
      jest
        .spyOn(ResourceRepository, "findById")
        .mockRejectedValueOnce(new Error("Err"));
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}/start`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /api/resources/:id/stop", () => {
    it("doit arrêter une ressource supportée", async () => {
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}/stop`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("doit refuser d'arrêter une ressource non arrêtable", async () => {
      jest.spyOn(ResourceRepository, "findById").mockResolvedValueOnce({
        typeRessource: "ARTICLE",
      } as any);
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}/stop`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(400);
    });

    it("doit renvoyer 404 si n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/resources/${fakeId}/stop`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 si crash", async () => {
      jest
        .spyOn(ResourceRepository, "findById")
        .mockRejectedValueOnce(new Error("Err"));
      const res = await request(app)
        .patch(`/api/resources/${publicResourceId}/stop`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/resources/user/:id", () => {
    it("doit retourner les ressources de l'utilisateur", async () => {
      const res = await request(app)
        .get(`/api/resources/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("doit refuser l'accès si l'utilisateur n'est ni l'auteur ni admin (403)", async () => {
      const res = await request(app)
        .get(`/api/resources/user/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it("doit renvoyer 500 si crash", async () => {
      jest
        .spyOn(ResourceRepository, "findByUserId")
        .mockRejectedValueOnce(new Error("Err"));
      const res = await request(app)
        .get(`/api/resources/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(500);
    });
  });
});
