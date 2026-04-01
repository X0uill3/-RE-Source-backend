import type { Request, Response } from "express";
import Resource from "../models/Ressource.js";
import { GlobalRole } from "../constants/roles.js";

/**
 * @desc    Lister les ressources publiques (Citoyen)
 * @route   GET /api/resources
 */
export const getAllResources = async (req: Request, res: Response) => {
  try {
    // Filtres dynamiques (Catégorie, Type, Relation)
    const { categorie, typeRessource, typeRelation, sort } = req.query;

    const query: any = {
      systemStatus: "Enabled",
      visibility: "Public",
    };

    if (categorie) query.categorie = categorie;
    if (typeRessource) query.typeRessource = typeRessource;
    if (typeRelation) query.typeRelation = typeRelation;

    const resources = await Resource.find(query)
      .populate("author", "firstname lastname")
      .populate("categorie typeRessource typeRelation")
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
    // Un utilisateur connecté voit tout ce qui est 'Enabled' (Public + Private)
    const resources = await Resource.find({ systemStatus: "Enabled" })
      .populate("author", "firstname lastname")
      .populate("categorie typeRessource")
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
      .populate("author", "firstname lastname")
      .populate("categorie typeRessource typeRelation")
      .populate("comments.author", "firstname");

    if (!resource)
      return res.status(404).json({ message: "Ressource non trouvée" });

    // Incrémentation auto des vues lors de l'affichage
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
    // Par défaut, une ressource créée par un Citoyen est "Disabled" (en attente de validation)
    // Sauf si c'est un ADMIN qui crée
    const status = req.user.role === GlobalRole.ADMIN ? "Enabled" : "Disabled";

    const data = {
      ...req.body,
      author: req.user._id,
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
    // Sécurité : on vérifie si l'utilisateur est l'auteur ou un admin
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

    // Si un citoyen modifie, on repasse le statut en 'Disabled' pour re-validation
    const updateData = { ...req.body };
    if (req.user.role !== GlobalRole.ADMIN) {
      updateData.systemStatus = "Disabled";
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
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
    // "Validation" correspond à passer le systemStatus à "Enabled"
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        systemStatus: "Enabled",
        updatedAt: Date.now(),
      },
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
