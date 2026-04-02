import request from "supertest";
import app from "../../index.js";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { GlobalRole } from "../../constants/roles.js";

describe("Auth Middleware Tests", () => {
  it("doit renvoyer 401 si aucun token n'est fourni (protect)", async () => {
    const res = await request(app).get("/api/users/me"); // Route protégée
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/aucun token/);
  });

  it("doit renvoyer 401 si le token est invalide", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer token-bidon");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token invalide/);
  });

  it("doit renvoyer 404 si l'utilisateur du token n'existe plus", async () => {
    // On crée un token pour un ID qui n'existe pas
    const fakeId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ id: fakeId }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("doit renvoyer 403 si le compte est désactivé", async () => {
    const user = await User.create({
      firstname: "Banni",
      lastname: "User",
      email: "banni@test.fr",
      password: "password123",
      systemStatus: "Disabled",
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Compte désactivé");
  });

  it("doit bloquer l'accès si l'utilisateur n'a pas le rôle requis (checkRole)", async () => {
    const user = await User.create({
      firstname: "Simple",
      lastname: "User",
      email: "user@test.fr",
      password: "password123",
      role: GlobalRole.USER,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Accès refusé/);
  });

  it("doit bloquer l'accès si le compte utilisateur est désactivé (protect)", async () => {
    await User.deleteMany({ email: "banni@test.fr" });
    const disabledUser = await User.create({
      firstname: "Banni",
      lastname: "User",
      email: "banni@test.fr",
      password: "password123",
      systemStatus: "Disabled",
    });

    const token = jwt.sign({ id: disabledUser._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Compte désactivé");
  });
});
