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

  beforeAll(async () => {
    await User.deleteMany({ email: newUser.email });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/auth/signup", () => {
    // IMPORTANT : On nettoie avant ce test précis pour être sûr que l'email est libre
    beforeEach(async () => {
      await User.deleteMany({ email: newUser.email });
    });

    it("doit créer un utilisateur et retourner un token JWT", async () => {
      const res = await request(app).post("/api/auth/signup").send(newUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body).toHaveProperty("token");
    });

    it("doit échouer si l'email est déjà utilisé", async () => {
      await User.create(newUser);
      const res = await request(app).post("/api/auth/signup").send(newUser);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeAll(async () => {
      await User.deleteMany({ email: newUser.email });
      await User.create(newUser);
    });

    it("doit connecter l'utilisateur avec les bons identifiants", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("doit refuser la connexion si le mot de passe est faux", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: newUser.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
    });

    it("doit bloquer la connexion si le compte est désactivé", async () => {
      await User.findOneAndUpdate(
        { email: newUser.email },
        { systemStatus: "Disabled" },
      );

      const res = await request(app).post("/api/auth/login").send({
        email: newUser.email,
        password: newUser.password,
      });

      expect(res.status).toBe(403);
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
  });
});
