import request from "supertest";
import mongoose from "mongoose";
import app from "../../index.js";
import User from "../../models/User.js";

describe("Auth System Integration Tests", () => {
  const newUser = {
    firstname: "Test",
    lastname: "User",
    email: "test@connexion.fr",
    password: "password1234",
    birthdate: "2000-01-01",
  };

  describe("POST /api/auth/signup", () => {
    it("doit créer un utilisateur et retourner un token JWT", async () => {
      const res = await request(app).post("/api/auth/signup").send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body).toHaveProperty("token");
      expect(res.body.data.user.email).toBe(newUser.email);
      // Sécurité : le mot de passe ne doit JAMAIS être dans la réponse
      expect(res.body.data.user).not.toHaveProperty("password");
    });

    it("doit échouer si l'email est déjà utilisé", async () => {
      // On en crée un premier
      await User.create(newUser);

      // On tente de recréer le même
      const res = await request(app).post("/api/auth/signup").send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await User.create(newUser);
    });

    it("doit connecter l'utilisateur avec les bons identifiants", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body).toHaveProperty("token");
    });

    it("doit refuser la connexion si le mot de passe est faux", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: newUser.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/incorrect/i);
    });

    it("doit bloquer la connexion si le compte est désactivé (systemStatus: Disabled)", async () => {
      // On désactive le compte manuellement
      await User.findOneAndUpdate(
        { email: newUser.email },
        { systemStatus: "Disabled" },
      );

      const res = await request(app).post("/api/auth/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/désactivé/i);
    });
  });
});
