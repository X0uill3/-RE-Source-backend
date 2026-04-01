import type { Request, Response } from "express";
import Resource from "../models/Ressource.js";
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

    const resources = await Resource.find(query)
      .populate("userId", "firstname lastname")
      .populate("categorie typeRelation")
      .sort(sort ? String(sort) : "-createdAt");

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
    const resources = await Resource.find({ systemStatus: "Enabled" })
      .populate("userId", "firstname lastname")
      .populate("categorie typeRelation")
      .sort("-createdAt");

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
    const resource = await Resource.findById(req.params.id)
      .populate("userId", "firstname lastname")
      .populate("categorie typeRelation");

    if (!resource)
      return res.status(404).json({ message: "Ressource non trouvée" });

    resource.views += 1;
    await resource.save();

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

    const data = {
      ...req.body,
      userId: req.user._id,
      systemStatus: status,
    };

    const resource = await Resource.create(data);

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
    const resourceToUpdate = await Resource.findById(req.params.id);

    if (!resourceToUpdate) {
      return res.status(404).json({ message: "Ressource non trouvée" });
    }

    if (
      resourceToUpdate.userId.toString() !== req.user._id.toString() &&
      req.user.role !== GlobalRole.ADMIN
    ) {
      return res.status(403).json({
        message: "Vous n'avez pas l'autorisation de modifier cette ressource",
      });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };

    // Sécurité : Un citoyen ne peut pas s'auto-valider en modifiant
    if (req.user.role !== GlobalRole.ADMIN) {
      updateData.systemStatus = "Disabled";
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
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
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { systemStatus: "Enabled", updatedAt: Date.now() },
      { new: true },
    );

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
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { systemStatus: "Disabled" },
      { new: true },
    );

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
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Ressource non trouvée" });
    }

    const playableTypes = [
      GlobalTypeRessource.GAME,
      GlobalTypeRessource.ACTIVITY,
    ];

    if (!playableTypes.includes(resource.typeRessource)) {
      return res.status(400).json({
        message:
          "Cette ressource n'est pas de type Jeu ou Activité et ne peut pas être démarrée.",
      });
    }

    resource.start = true;
    resource.updatedAt = new Date();

    await resource.save();

    res.status(200).json({
      status: "success",
      message: "La ressource a été démarrée",
      data: { resource },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
