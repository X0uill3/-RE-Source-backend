import * as ResourceController from "../../controllers/ressourceController.js";
import ResourceRepository from "../../repositories/ressourceRepository.js";
import { GlobalRole } from "../../constants/roles.js";
import { GlobalTypeRessource } from "../../constants/typeRessource.js";
import { jest } from "@jest/globals";
import mongoose from "mongoose";

describe("ResourceController - Unit Tests", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    // Initialisation des mocks Express
    req = {
      params: {},
      query: {},
      body: {},
      user: {
        _id: new mongoose.Types.ObjectId().toString(),
        role: GlobalRole.USER,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- TEST : getResource (Incrémentation des vues) ---
  describe("getResource", () => {
    it("doit renvoyer 200, incrémenter views et appeler save", async () => {
      req.params.id = "res_123";
      const mockResource = {
        title: "Test",
        views: 5,
        save: jest.fn(),
      };

      jest
        .spyOn(ResourceRepository, "findById")
        .mockResolvedValue(mockResource as any);
      jest
        .spyOn(ResourceRepository, "save")
        .mockResolvedValue(mockResource as any);

      await ResourceController.getResource(req, res);

      expect(mockResource.views).toBe(6);
      expect(ResourceRepository.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("doit renvoyer 404 si la ressource n'existe pas", async () => {
      jest.spyOn(ResourceRepository, "findById").mockResolvedValue(null);

      await ResourceController.getResource(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // --- TEST : createResource (Logique de statut par rôle) ---
  describe("createResource", () => {
    it("doit mettre systemStatus à 'Disabled' pour un utilisateur normal", async () => {
      req.body = { title: "Nouvelle ressource" };

      const createSpy = jest
        .spyOn(ResourceRepository, "create")
        .mockResolvedValue({} as any);

      await ResourceController.createResource(req, res);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          systemStatus: "Disabled",
          userId: req.user._id,
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("doit mettre systemStatus à 'Enabled' pour un ADMIN", async () => {
      req.user.role = GlobalRole.ADMIN;
      req.body = { title: "Ressource Admin" };

      const createSpy = jest
        .spyOn(ResourceRepository, "create")
        .mockResolvedValue({} as any);

      await ResourceController.createResource(req, res);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          systemStatus: "Enabled",
        }),
      );
    });
  });

  // --- TEST : updateResource (Autorisation & Reset Statut) ---
  describe("updateResource", () => {
    it("doit refuser la modification si l'utilisateur n'est pas l'auteur (403)", async () => {
      req.params.id = "res_abc";
      const otherUserId = new mongoose.Types.ObjectId();

      const mockResource = {
        userId: { _id: otherUserId },
      };

      jest
        .spyOn(ResourceRepository, "findById")
        .mockResolvedValue(mockResource as any);

      await ResourceController.updateResource(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Autorisation refusée",
      });
    });

    it("doit repasser en 'Disabled' après modification par un auteur non-admin", async () => {
      req.params.id = "res_abc";
      const mockResource = { userId: { _id: req.user._id } };

      jest
        .spyOn(ResourceRepository, "findById")
        .mockResolvedValue(mockResource as any);
      const updateSpy = jest
        .spyOn(ResourceRepository, "update")
        .mockResolvedValue({} as any);

      await ResourceController.updateResource(req, res);

      expect(updateSpy).toHaveBeenCalledWith(
        "res_abc",
        expect.objectContaining({ systemStatus: "Disabled" }),
      );
    });
  });

  // --- TEST : startResource (Validation des types démarrables) ---
  describe("startResource", () => {
    it("doit renvoyer 400 si le type n'est ni GAME ni ACTIVITY", async () => {
      const mockResource = { typeRessource: "ARTICLE" };
      jest
        .spyOn(ResourceRepository, "findById")
        .mockResolvedValue(mockResource as any);

      await ResourceController.startResource(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Type de ressource non démarrable.",
      });
    });

    it("doit mettre start à false et renvoyer 200 pour un type GAME", async () => {
      const mockResource = {
        typeRessource: GlobalTypeRessource.GAME,
        start: true,
      };
      jest
        .spyOn(ResourceRepository, "findById")
        .mockResolvedValue(mockResource as any);
      jest
        .spyOn(ResourceRepository, "save")
        .mockResolvedValue(mockResource as any);

      await ResourceController.startResource(req, res);

      expect(mockResource.start).toBe(false);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
