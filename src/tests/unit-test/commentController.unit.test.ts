import * as CommentController from "../../controllers/commentController.js";
import CommentRepository from "../../repositories/commentRepository.js";
import { jest } from "@jest/globals";

describe("CommentController - Unit Tests", () => {
  let req: any, res: any;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("updateComment", () => {
    it("doit retourner 403 si l'utilisateur n'est pas l'auteur", async () => {
      const mockComment = {
        authorId: "real_author_id",
        content: "Hello",
        toString: () => "comment_object",
      };

      req = {
        params: { id: "comm_123" },
        user: { _id: "hacker_id", role: "Citoyen" }, // ID différent de l'auteur
        body: { content: "Hacked" },
      };

      jest
        .spyOn(CommentRepository, "findById")
        .mockResolvedValue(mockComment as any);

      await CommentController.updateComment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Non autorisé à modifier ce commentaire",
        }),
      );
    });
  });
});
