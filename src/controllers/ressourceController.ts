import type { Request, Response } from "express";
import ResourceRepository from "../repositories/ressourceRepository.js";
import { GlobalRole } from "../constants/roles.js";
import { GlobalTypeRessource } from "../constants/typeRessource.js";

/**
 * @desc    Lister les ressources publiques (Citoyen)
 * @route   GET /api/resources
 */
export const getAllResources = async (req: Request, res: Response) => {
  try {
    const { categorie, typeRessource, typeRelation, sort } = req.query;

    const query: any = {
      systemStatus: "Enabled",
      visibility: "Public",
    };

    if (categorie) query.categorie = categorie;
    if (typeRessource) query.typeRessource = typeRessource;
    if (typeRelation) query.typeRelation = typeRelation;

    const resources = await ResourceRepository.findAll(
      query,
      sort ? String(sort) : "-createdAt",
    );

    res.status(200).json({
      status: "success",
      results: resources.length,
      data: { resources },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Lister les ressources restreintes (Citoyen connecté)
 * @route   GET /api/resources/restricted
 */
export const getRestrictedResources = async (req: any, res: Response) => {
  try {
    const query = {
      systemStatus: "Enabled",
      visibility: "Restricted",
    };

    const sort = "-createdAt";
    const resources = await ResourceRepository.findAll(query, sort);

    res.status(200).json({ status: "success", data: { resources } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc Lister les ressources les + populaires (Citoyen)
 * @route GET /api/resources/popular
 */
export const getPopularResources = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const resources = await ResourceRepository.findPopular(limit);
    res.status(200).json({ status: "success", data: { resources } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Afficher une ressource précise
 * @route   GET /api/resources/:id
 */
export const getResource = async (req: Request, res: Response) => {
  try {
    const resource = await ResourceRepository.findById(req.params.id as string);

    if (!resource)
      return res.status(404).json({ message: "Ressource non trouvée" });

    resource.views += 1;
    await ResourceRepository.save(resource);

    res.status(200).json({ status: "success", data: { resource } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Créer une ressource (Citoyen & Admin)
 * @route   POST /api/resources
 */
export const createResource = async (req: any, res: Response) => {
  try {
    const status = req.user.role === GlobalRole.ADMIN ? "Enabled" : "Disabled";
    const data = { ...req.body, userId: req.user._id, systemStatus: status };

    const resource = await ResourceRepository.create(data);

    res.status(201).json({ status: "success", data: { resource } });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Modifier une ressource (Citoyen & Admin)
 * @route   PATCH /api/resources/:id
 */
export const updateResource = async (req: any, res: Response) => {
  try {
    const resourceToUpdate = await ResourceRepository.findById(
      req.params.id as string,
    );

    if (!resourceToUpdate)
      return res.status(404).json({ message: "Ressource non trouvée" });

    if (
      resourceToUpdate.userId.toString() !== req.user._id.toString() &&
      req.user.role !== GlobalRole.ADMIN
    ) {
      return res.status(403).json({ message: "Autorisation refusée" });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };
    if (req.user.role !== GlobalRole.ADMIN)
      updateData.systemStatus = "Disabled";

    const resource = await ResourceRepository.update(
      req.params.id as string,
      updateData,
    );

    res.status(200).json({ status: "success", data: { resource } });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Validation d'une ressource (Modérateur/Admin)
 * @route   PATCH /api/resources/:id/validate
 */
export const validateResource = async (req: Request, res: Response) => {
  try {
    const resource = await ResourceRepository.update(req.params.id as string, {
      systemStatus: "Enabled",
      updatedAt: new Date(),
    });

    if (!resource)
      return res.status(404).json({ message: "Ressource non trouvée" });

    res.status(200).json({ status: "success", data: { resource } });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Supprimer / Suspendre (Admin)
 * @route   DELETE /api/resources/:id
 */
export const deleteResource = async (req: Request, res: Response) => {
  try {
    const resource = await ResourceRepository.update(req.params.id as string, {
      systemStatus: "Disabled",
    });

    if (!resource)
      return res.status(404).json({ message: "Ressource non trouvée" });

    res.status(204).json({ status: "success", data: null });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Démarrer une ressource de type Activité/Jeu
 * @route   PATCH /api/resources/:id/start
 */
export const startResource = async (req: Request, res: Response) => {
  try {
    const resource = await ResourceRepository.findById(req.params.id as string);

    if (!resource)
      return res.status(404).json({ message: "Ressource non trouvée" });

    const playableTypes = [
      GlobalTypeRessource.GAME,
      GlobalTypeRessource.ACTIVITY,
    ];

    if (!playableTypes.includes(resource.typeRessource)) {
      return res
        .status(400)
        .json({ message: "Type de ressource non démarrable." });
    }

    resource.start = false;
    resource.updatedAt = new Date();
    await ResourceRepository.save(resource);

    res.status(200).json({ status: "success", data: { resource } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Arrêter une ressource de type Activité/Jeu
 * @route   PATCH /api/resources/:id/stop
 */
export const stopResource = async (req: Request, res: Response) => {
  try {
    const resource = await ResourceRepository.findById(req.params.id as string);

    if (!resource)
      return res.status(404).json({ message: "Ressource non trouvée" });

    const playableTypes = [
      GlobalTypeRessource.GAME,
      GlobalTypeRessource.ACTIVITY,
    ];

    if (!playableTypes.includes(resource.typeRessource)) {
      return res
        .status(400)
        .json({ message: "Type de ressource non arrêtable." });
    }

    resource.start = false;
    resource.updatedAt = new Date();
    await ResourceRepository.save(resource);

    res.status(200).json({ status: "success", data: { resource } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Récupérer les ressources d'un utilisateur
 * @route   GET /api/resources/user/:id
 * @access  Privé (Admin ou propriétaire des ressources)
 */
export const getUserResources = async (req: any, res: Response) => {
  try {
    const userId = req.params.id as string;
    if (
      userId !== req.user._id.toString() &&
      req.user.role !== GlobalRole.ADMIN
    ) {
      return res.status(403).json({
        status: "error",
        message: "Non autorisé à accéder aux ressources de cet utilisateur",
      });
    }
    const resources = await ResourceRepository.findByUserId(userId);
    res.status(200).json({
      status: "success",
      results: resources.length,
      data: { resources },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Réactiver une ressource désactivée (Admin)
 * @route   PATCH /api/resources/:id/enable
 */
export const enableResource = async (req: Request, res: Response) => {
  try {
    const resource = await ResourceRepository.update(req.params.id as string, {
      systemStatus: "Enabled",
      updatedAt: new Date(),
    });

    if (!resource)
      return res.status(404).json({ message: "Ressource non trouvée" });

    res.status(200).json({ status: "success", data: { resource } });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
