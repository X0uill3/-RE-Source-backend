import * as CategoryController from "../../controllers/categorieController.js";
import CategorieRepository from "../../repositories/categorieRepository.js";
import { jest } from "@jest/globals";

describe("CategoryController - Unit Tests", () => {
  let req: any, res: any;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("disableCategory", () => {
    it("doit passer le statut en Disabled et sauvegarder", async () => {
      const mockCat = {
        name: "Sport",
        systemStatus: "Enabled",
      };

      req = { params: { id: "cat_123" } };
      jest
        .spyOn(CategorieRepository, "findByIdAndStatus")
        .mockResolvedValue(mockCat as any);
      jest.spyOn(CategorieRepository, "save").mockResolvedValue(mockCat as any);

      await CategoryController.disableCategory(req, res);

      expect(mockCat.systemStatus).toBe("Disabled");
      expect(CategorieRepository.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
