import * as UserController from "../../controllers/userController.js";
import UserRepository from "../../repositories/userRepository.js";
import { jest } from "@jest/globals";

describe("UserController - Unit Tests", () => {
  let req: any, res: any;

  beforeEach(() => {
    req = { user: { _id: "my_id" }, body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("updateMyPassword", () => {
    it("doit renvoyer 400 si les nouveaux mots de passe ne correspondent pas", async () => {
      req.body = { password: "new", passwordConfirm: "different" };

      await UserController.updateMyPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Les mots de passe ne correspondent pas.",
        }),
      );
    });

    it("doit renvoyer 401 si le mot de passe actuel est faux", async () => {
      const mockUser = {
        comparePassword: jest
          .fn<() => Promise<boolean>>()
          .mockResolvedValue(false),
      };
      req.body = {
        passwordCurrent: "wrong",
        password: "new",
        passwordConfirm: "new",
      };

      jest
        .spyOn(UserRepository, "findByIdWithPassword")
        .mockResolvedValue(mockUser as any);

      await UserController.updateMyPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("updateUser (Admin Logic)", () => {
    it("doit permettre à l'admin de modifier n'importe quel utilisateur", async () => {
      req.params.id = "other_user_id";
      req.body = { role: "Moderator" };
      const updatedUser = { _id: "other_user_id", role: "Moderator" };

      jest
        .spyOn(UserRepository, "update")
        .mockResolvedValue(updatedUser as any);

      await UserController.updateUser(req, res);

      expect(UserRepository.update).toHaveBeenCalledWith("other_user_id", {
        role: "Moderator",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteMe", () => {
    it("doit supprimer le compte de l'utilisateur connecté (204)", async () => {
      jest.spyOn(UserRepository, "deleteById").mockResolvedValue({} as any);

      await UserController.deleteMe(req, res);

      expect(UserRepository.deleteById).toHaveBeenCalledWith("my_id");
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
