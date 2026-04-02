import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import User from "../../models/User.js";
import { GlobalRole } from "../../constants/roles.js";
import { jest } from "@jest/globals";

describe("User Controller Integration Tests", () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let adminId: string;

  beforeAll(async () => {
    await User.deleteMany({});

    // 1. Création d'un Admin
    const adminRes = await request(app).post("/api/auth/signup").send({
      firstname: "Admin",
      lastname: "User",
      email: "admin@test.fr",
      password: "password123",
      birthdate: "1990-01-01",
    });
    await User.findByIdAndUpdate(adminRes.body.data.user._id, {
      role: GlobalRole.ADMIN,
    });
    adminToken = adminRes.body.token;
    adminId = adminRes.body.data.user._id;

    // 2. Création d'un Utilisateur simple
    const userRes = await request(app).post("/api/auth/signup").send({
      firstname: "John",
      lastname: "Doe",
      email: "john@test.fr",
      password: "password123",
      birthdate: "1995-05-05",
    });
    userToken = userRes.body.token;
    userId = userRes.body.data.user._id;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/users/me", () => {
    it("doit retourner le profil de l'utilisateur connecté", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("john@test.fr");
    });

    it("doit renvoyer 500 en cas de crash", async () => {
      const spy = jest.spyOn(JSON, "stringify").mockImplementationOnce(() => {
        throw new Error("Crash JSON");
      });

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Crash JSON");

      spy.mockRestore();
    });
  });

  describe("PATCH /api/users/updateMe", () => {
    it("doit mettre à jour les informations de l'utilisateur", async () => {
      const res = await request(app)
        .patch("/api/users/updateMe")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ firstname: "Johnny" });
      expect(res.status).toBe(200);
      expect(res.body.data.user.firstname).toBe("Johnny");
    });

    it("doit renvoyer 400 en cas d'erreur de validation ou crash", async () => {
      const spy = jest
        .spyOn(User, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("UpdateMe Crash");
        });
      const res = await request(app)
        .patch("/api/users/updateMe")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ firstname: "Fail" });
      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("PATCH /api/users/updateMyPassword", () => {
    it("doit changer le mot de passe avec succès", async () => {
      const res = await request(app)
        .patch("/api/users/updateMyPassword")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          passwordCurrent: "password123",
          password: "newpassword123",
          passwordConfirm: "newpassword123",
        });
      expect(res.status).toBe(200);
    });

    it("doit échouer si les nouveaux mots de passe ne correspondent pas", async () => {
      const res = await request(app)
        .patch("/api/users/updateMyPassword")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          passwordCurrent: "newpassword123",
          password: "pass1",
          passwordConfirm: "pass2",
        });
      expect(res.status).toBe(400);
    });

    it("doit échouer si le mot de passe actuel est incorrect", async () => {
      const res = await request(app)
        .patch("/api/users/updateMyPassword")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          passwordCurrent: "wrongpass",
          password: "newpassword456",
          passwordConfirm: "newpassword456",
        });
      expect(res.status).toBe(401);
    });

    it("doit renvoyer 500 si le processus crash", async () => {
      const spy = jest.spyOn(User, "findById").mockImplementationOnce(() => {
        throw new Error("Password Crash");
      });
      const res = await request(app)
        .patch("/api/users/updateMyPassword")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("GET /api/users (Admin)", () => {
    it("doit lister tous les utilisateurs pour l'admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.results).toBeGreaterThanOrEqual(2);
    });

    it("doit renvoyer 500 si la récupération crash", async () => {
      const spy = jest.spyOn(User, "find").mockImplementationOnce(() => {
        throw new Error("FindAll Crash");
      });
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
      spy.mockRestore();
    });
  });

  describe("PATCH /api/users/:id (Admin)", () => {
    it("doit permettre à l'admin de modifier un utilisateur", async () => {
      const res = await request(app)
        .patch(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: GlobalRole.MODERATOR });
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe(GlobalRole.MODERATOR);
    });

    it("doit renvoyer 404 si l'utilisateur n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ firstname: "Invisible" });
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 si updateUser crash (Admin)", async () => {
      const spy = jest
        .spyOn(User, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Update Crash");
        });
      const res = await request(app)
        .patch(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: GlobalRole.ADMIN });

      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("DELETE /api/users/:id (Admin Disable)", () => {
    it("doit désactiver le compte d'un utilisateur", async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.systemStatus).toBe("Disabled");
    });

    it("doit renvoyer une 404 si l'utilisateur à désactiver n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 si deleteUser crash", async () => {
      const spy = jest
        .spyOn(User, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Delete Error");
        });
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("PATCH /api/users/:id/reactivate (Admin)", () => {
    it("doit réactiver le compte d'un utilisateur", async () => {
      const res = await request(app)
        .patch(`/api/users/${userId}/reactivate`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.systemStatus).toBe("Enabled");
    });

    it("doit renvoyer une 404 si l'utilisateur à réactiver n'existe pas", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/users/${fakeId}/reactivate`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it("doit renvoyer une 400 si reactivateUser crash", async () => {
      const spy = jest
        .spyOn(User, "findByIdAndUpdate")
        .mockImplementationOnce(() => {
          throw new Error("Reactivate Error");
        });
      const res = await request(app)
        .patch(`/api/users/${userId}/reactivate`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });

  describe("DELETE /api/users/deleteMe", () => {
    it("doit permettre à l'utilisateur de supprimer son propre compte", async () => {
      const res = await request(app)
        .delete("/api/users/deleteMe")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(204);

      const check = await User.findById(userId);
      expect(check).toBeNull();
    });

    it("doit renvoyer 400 si la suppression propre crash", async () => {
      const spy = jest
        .spyOn(User, "findByIdAndDelete")
        .mockImplementationOnce(() => {
          throw new Error("DeleteMe Crash");
        });
      const res = await request(app)
        .delete("/api/users/deleteMe")
        .set("Authorization", `Bearer ${adminToken}`); // On utilise l'admin car l'autre est supprimé
      expect(res.status).toBe(400);
      spy.mockRestore();
    });
  });
});
