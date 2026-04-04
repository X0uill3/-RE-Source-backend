import * as InteractionController from "../../controllers/interactionController.js";
import InteractionRepository from "../../repositories/interactionRepository.js";
import { jest } from "@jest/globals";

describe("InteractionController - Unit Tests", () => {
  let req: any, res: any;

  beforeEach(() => {
    req = { user: { _id: "user_123" }, body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("recordInteraction", () => {
    it("doit créer une interaction avec les bonnes données", async () => {
      req.body = { interactionType: "Like", ressourceId: "res_456" };
      const mockInteraction = { ...req.body, UserId: "user_123" };

      jest
        .spyOn(InteractionRepository, "create")
        .mockResolvedValue(mockInteraction as any);

      await InteractionController.recordInteraction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "success" }),
      );
    });
  });

  describe("deleteInteraction", () => {
    it("doit renvoyer 404 si l'interaction n'existe pas", async () => {
      req.params.id = "inter_999";
      jest
        .spyOn(InteractionRepository, "deleteUserInteraction")
        .mockResolvedValue(null);

      await InteractionController.deleteInteraction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Interaction non trouvée" }),
      );
    });
  });
});
