import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import Comment from "../../models/Comment.js";
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

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/comments/ressource/:id", () => {
    it("doit récupérer les commentaires d'une ressource", async () => {
      const res = await request(app).get(
        `/api/comments/ressource/${ressourceId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.results).toBeGreaterThanOrEqual(1);
    });

    it("doit renvoyer 500 en cas d'erreur serveur (find)", async () => {
      const spy = jest.spyOn(Comment, "find").mockImplementationOnce(() => {
        throw new Error("DB Fail");
      });
      const res = await request(app).get(
        `/api/comments/ressource/${ressourceId}`,
      );
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("POST /api/comments/ressource/:id", () => {
    it("doit ajouter un commentaire à une ressource", async () => {
      const res = await request(app)
        .post(`/api/comments/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Nouveau commentaire", ressourceId });

      expect(res.status).toBe(201);
      expect(res.body.data.comment.content).toBe("Nouveau commentaire");
    });

    it("doit retourner 400 en cas de données invalides", async () => {
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

    it("doit retourner 404 si le commentaire à modifier n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/comments/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ content: "test" });
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 en cas d'erreur serveur lors de la modification", async () => {
      const spy = jest.spyOn(Comment, "findById").mockImplementationOnce(() => {
        throw new Error("Crash");
      });
      const res = await request(app)
        .patch(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("DELETE /api/comments/:id", () => {
    it("doit permettre à l'admin de supprimer un commentaire", async () => {
      const res = await request(app)
        .delete(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit refuser la suppression si l'utilisateur n'est pas autorisé (403)", async () => {
      const newComment = await Comment.create({
        content: "Private",
        authorId: adminId,
        ressourceId,
      });
      const res = await request(app)
        .delete(`/api/comments/${newComment._id}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it("doit retourner 404 si le commentaire n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer 500 en cas d'erreur serveur lors de la suppression", async () => {
      const spy = jest.spyOn(Comment, "findById").mockImplementationOnce(() => {
        throw new Error("Crash");
      });
      const res = await request(app)
        .delete(`/api/comments/${testCommentId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/comments/user/:id", () => {
    it("doit permettre à un utilisateur de voir ses propres commentaires", async () => {
      const res = await request(app)
        .get(`/api/comments/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });

    it("doit refuser l'accès aux commentaires d'un autre utilisateur (403)", async () => {
      const res = await request(app)
        .get(`/api/comments/user/${adminId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it("doit renvoyer 500 si la récupération par utilisateur crash", async () => {
      const spy = jest.spyOn(Comment, "find").mockImplementationOnce(() => {
        throw new Error("Crash");
      });
      const res = await request(app)
        .get(`/api/comments/user/${userId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/admin/comments", () => {
    it("doit permettre à l'admin de récupérer tous les commentaires", async () => {
      const res = await request(app)
        .get("/api/comments/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si la récupération globale admin crash", async () => {
      const spy = jest.spyOn(Comment, "find").mockImplementationOnce(() => {
        throw new Error("Crash findAll Admin");
      });
      const res = await request(app)
        .get("/api/comments/admin/comments")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("DELETE /api/comments/ressource/:id", () => {
    it("doit permettre à l'admin de supprimer les commentaires par ressource", async () => {
      const res = await request(app)
        .delete(`/api/comments/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si la suppression par ressource crash", async () => {
      const spy = jest
        .spyOn(Comment, "deleteMany")
        .mockImplementationOnce(() => {
          throw new Error("Crash");
        });
      const res = await request(app)
        .delete(`/api/comments/ressource/${ressourceId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("DELETE /api/comments/user/:id", () => {
    it("doit permettre à l'admin de supprimer tous les commentaires d'un utilisateur", async () => {
      const res = await request(app)
        .delete(`/api/comments/user/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("doit renvoyer 500 si la suppression par utilisateur crash", async () => {
      const spy = jest
        .spyOn(Comment, "deleteMany")
        .mockImplementationOnce(() => {
          throw new Error("Crash deleteMany User");
        });
      const res = await request(app)
        .delete(`/api/comments/user/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });
});
