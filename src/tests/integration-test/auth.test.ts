import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import app from "../../index.js";
import User from "../../models/User.js";
import UserRepository from "../../repositories/userRepository.js"; // Import du Repository

describe("Auth System Integration Tests", () => {
  const newUser = {
    firstname: "Test",
    lastname: "User",
    email: "test@connexion.fr",
    password: "password1234",
    birthdate: new Date("1990-01-01"),
  };

  beforeAll(async () => {
    await User.deleteMany({ email: newUser.email });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/auth/signup", () => {
    beforeEach(async () => {
      await User.deleteMany({ email: newUser.email });
    });

    it("doit créer un utilisateur via UserRepository et retourner un token JWT", async () => {
      const res = await request(app).post("/api/auth/signup").send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body).toHaveProperty("token");
      expect(res.body.data.user.email).toBe(newUser.email);
    });

    it("doit échouer si l'email est déjà utilisé", async () => {
      // On utilise le repository pour la configuration du test
      await UserRepository.create(newUser);

      const res = await request(app).post("/api/auth/signup").send(newUser);
      expect(res.status).toBe(400);
    });

    it("doit renvoyer une 400 si UserRepository.create crash (catch)", async () => {
      const spy = jest
        .spyOn(UserRepository, "create")
        .mockImplementationOnce(() => {
          throw new Error("Signup Repository Crash");
        });

      const res = await request(app).post("/api/auth/signup").send(newUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Signup Repository Crash");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeAll(async () => {
      await User.deleteMany({ email: newUser.email });
      await UserRepository.create(newUser);
    });

    it("doit connecter l'utilisateur avec les bons identifiants via Repository", async () => {
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
      expect(res.body.message).toBe("Email ou mot de passe incorrect");
    });

    it("doit bloquer la connexion si le compte est désactivé", async () => {
      // Mise à jour via le repository pour le test
      const user = await User.findOne({ email: newUser.email });
      if (user) {
        await UserRepository.update(user._id.toString(), {
          systemStatus: "Disabled",
        });
      }

      const res = await request(app).post("/api/auth/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/désactivé/);

      // Réactivation pour ne pas bloquer les tests suivants si nécessaire
      if (user) {
        await UserRepository.update(user._id.toString(), {
          systemStatus: "Enabled",
        });
      }
    });

    it("doit échouer si l'email ou le mot de passe est manquant", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.fr" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(
        "Veuillez fournir un email et un mot de passe",
      );
    });

    it("doit renvoyer une 400 si UserRepository.findByEmailWithPassword crash (catch)", async () => {
      const spy = jest
        .spyOn(UserRepository, "findByEmailWithPassword")
        .mockImplementationOnce(() => {
          throw new Error("Login Repository Crash");
        });

      const res = await request(app).post("/api/auth/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Login Repository Crash");
    });
  });

  describe("SignToken Security", () => {
    it("doit jeter une erreur si JWT_SECRET n'est pas défini", async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const res = await request(app).post("/api/auth/signup").send({
        firstname: "No",
        lastname: "Secret",
        email: "nosecret@test.fr",
        password: "password123",
        birthdate: "2000-01-01",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/JWT_SECRET n'est pas définie/);

      process.env.JWT_SECRET = originalSecret; // Toujours restaurer !
    });
  });
});
