import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import Comment from "../../models/Comment.js";
import CommentRepository from "../../repositories/commentRepository.js"; // Import du Repository
import User from "../../models/User.js";
import { GlobalRole } from "../../constants/roles.js";
import { jest } from "@jest/globals";

describe("Comment Controller Integration Tests", () => {
  let adminToken: string;
  let userToken: string;
  let otherUserToken: string;
  let adminId: string;
  let userId: string;
  let ressourceId: string;
  let testCommentId: string;

  beforeAll(async () => {
    await User.deleteMany({});
    await Comment.deleteMany({});

    const adminRes = await request(app).post("/api/auth/signup").send({
      firstname: "Admin",
      lastname: "Comment",
      email: "admin.com@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    // On utilise le repo pour forcer le rôle
    await User.findByIdAndUpdate(adminRes.body.data.user._id, {
      role: GlobalRole.ADMIN,
    });
    adminToken = adminRes.body.token;
    adminId = adminRes.body.data.user._id;

    const userRes = await request(app).post("/api/auth/signup").send({
      firstname: "User",
      lastname: "Comment",
      email: "user.com@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    userToken = userRes.body.token;
    userId = userRes.body.data.user._id;

    const otherRes = await request(app).post("/api/auth/signup").send({
      firstname: "Other",
      lastname: "User",
      email: "other@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    otherUserToken = otherRes.body.token;

    ressourceId = new mongoose.Types.ObjectId().toString();

    const comment = await Comment.create({
      content: "Commentaire initial",
      authorId: userId,
      ressourceId: ressourceId,
    });
    testCommentId = comment._id.toString();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/comments/ressource/:id", () => {
    it("doit récupérer les commentaires d'une ressource via Repository", async () => {
      const res = await request(app).get(
        `/api/comments/ressource/${ressourceId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.results).toBeGreaterThanOrEqual(1);
    });

    it("doit renvoyer 500 si CommentRepository.findByResourceId crash", async () => {
      const spy = jest
        .spyOn(CommentRepository, "findByResourceId")
        .mockImplementationOnce(() => {
          throw new Error("Find Ressource Fail");
        });
      const res = await request(app).get(
        `/api/comments/ressource/${ressourceId}`,
      );
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Find Ressource Fail");
    });
  });

  // Dans src/tests/integration-test/comment.test.ts

  describe("POST /api/comments", () => {
    it("doit ajouter un commentaire via Repository", async () => {
      const res = await request(app)
        .post(`/api/comments/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ ressourceId: ressourceId, content: "Nouveau commentaire" });
      expect(res.status).toBe(201);
      expect(res.body.data.comment.content).toBe("Nouveau commentaire");
    });

    it("doit retourner 400 si CommentRepository.create crash", async () => {
      jest.spyOn(CommentRepository, "create").mockImplementationOnce(() => {
        throw new Error("Validation Fail");
      });

      const res = await request(app)
        .post(`/api/comments/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/comments/:id", () => {
    it("doit permettre à l'auteur de modifier son commentaire", async () => {
      const res = await request(app)
        .patch(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Contenu modifié" });
      expect(res.status).toBe(200);
    });

    it("doit refuser la modification par un autre utilisateur (403)", async () => {
      const res = await request(app)
        .patch(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({ content: "Tentative" });
      expect(res.status).toBe(403);
    });

    it("doit renvoyer 500 si CommentRepository.save crash lors de l'update", async () => {
      const spy = jest
        .spyOn(CommentRepository, "save")
        .mockImplementationOnce(() => {
          throw new Error("Save Crash");
        });
      const res = await request(app)
        .patch(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Update test" });
      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /api/comments/:id", () => {
    it("doit permettre à l'admin de supprimer un commentaire", async () => {
      const res = await request(app)
        .delete(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit retourner 404 si CommentRepository.findById ne trouve rien", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/comments/user/:id", () => {
    it("doit permettre à un utilisateur de voir ses propres commentaires via Repository", async () => {
      const res = await request(app)
        .get(`/api/comments/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("doit refuser l'accès aux commentaires d'autrui (403)", async () => {
      const res = await request(app)
        .get(`/api/comments/user/${adminId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it("doit renvoyer 500 si findByUserId crash", async () => {
      const spy = jest
        .spyOn(CommentRepository, "findByUserId")
        .mockImplementationOnce(() => {
          throw new Error("User Find Crash");
        });
      const res = await request(app)
        .get(`/api/comments/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/admin/comments (Modération)", () => {
    it("doit permettre à l'admin de récupérer tous les commentaires", async () => {
      // Note: la route dans ton contrôleur semble être /api/admin/comments d'après le JSDoc
      // J'adapte selon l'URL de ton fichier original
      const res = await request(app)
        .get("/api/comments/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si CommentRepository.findAll crash", async () => {
      const spy = jest
        .spyOn(CommentRepository, "findAll")
        .mockImplementationOnce(() => {
          throw new Error("Global Admin Crash");
        });
      const res = await request(app)
        .get("/api/comments/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /api/comments/ressource/:id", () => {
    it("doit supprimer les commentaires d'une ressource via Repository", async () => {
      const res = await request(app)
        .delete(`/api/comments/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si deleteManyByResourceId crash", async () => {
      const spy = jest
        .spyOn(CommentRepository, "deleteManyByResourceId")
        .mockImplementationOnce(() => {
          throw new Error("Ressource Delete Crash");
        });
      const res = await request(app)
        .delete(`/api/comments/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /api/comments/user/:id", () => {
    it("doit supprimer les commentaires d'un utilisateur via Repository", async () => {
      const res = await request(app)
        .delete(`/api/comments/user/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si la suppression par utilisateur crash", async () => {
      const spy = jest
        .spyOn(CommentRepository, "deleteManyByUserId")
        .mockImplementationOnce(() => {
          throw new Error("Crash deleteManyByUserId");
        });
      const res = await request(app)
        .delete(`/api/comments/user/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });
});
