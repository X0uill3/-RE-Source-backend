import * as AuthController from "../../controllers/authController.js";
import UserRepository from "../../repositories/userRepository.js";
import { jest } from "@jest/globals";
import { GlobalRole } from "../../constants/roles.js";

describe("AuthController - Unit Tests", () => {
  let req: any, res: any;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    process.env.JWT_SECRET = "test_secret";
  });

  describe("signup", () => {
    it("doit créer un utilisateur et retourner un token", async () => {
      const mockUser = {
        _id: "user_123",
        toObject: jest
          .fn()
          .mockReturnValue({ _id: "user_123", firstname: "Test" }),
      };

      req.body = { email: "test@test.fr", password: "password" };
      jest.spyOn(UserRepository, "create").mockResolvedValue(mockUser as any);

      await AuthController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          token: expect.any(String),
        }),
      );
    });
  });

  describe("login", () => {
    it("doit refuser si le mot de passe est incorrect", async () => {
      const mockUser = {
        _id: "user_123",
        comparePassword: jest
          .fn<() => Promise<boolean>>()
          .mockResolvedValue(false),
      };

      req.body = { email: "test@test.fr", password: "wrong_password" };
      jest
        .spyOn(UserRepository, "findByEmailWithPassword")
        .mockResolvedValue(mockUser as any);

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email ou mot de passe incorrect",
      });
    });
  });
});
