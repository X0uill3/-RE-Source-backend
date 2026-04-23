import { type Response } from "express";
import InteractionRepository from "../repositories/interactionRepository.js";

/**
 * @desc    Enregistrer une interaction (vue, favori, sauvegarde)
 * @route   POST /api/interactions
 * @access  Privé (Utilisateur connecté)
 */
export const recordInteraction = async (req: any, res: Response) => {
  try {
    const { interactionType, ressourceId, ReceiverId } = req.body;

    const newInteraction = await InteractionRepository.create({
      UserId: req.user._id,
      interactionType,
      ressourceId,
      ReceiverId: ReceiverId || null,
    });

    res.status(201).json({
      status: "success",
      data: { interaction: newInteraction },
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Récupérer les interactions d'un utilisateur
 * @route   GET /api/interactions
 * @access  Privé (Utilisateur connecté)
 */
export const getUserInteractions = async (req: any, res: Response) => {
  try {
    const interactions = await InteractionRepository.findByUserId(req.user._id);

    res.status(200).json({
      status: "success",
      results: interactions.length,
      data: { interactions },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Supprimer une interaction (ex: retirer un favori)
 * @route   DELETE /api/interactions/:id
 * @access  Privé (Utilisateur connecté)
 */
export const deleteInteraction = async (req: any, res: Response) => {
  try {
    const interaction = await InteractionRepository.deleteUserInteraction(
      req.params.id as string,
      req.user._id,
    );

    if (!interaction) {
      return res
        .status(404)
        .json({ status: "error", message: "Interaction non trouvée" });
    }

    res
      .status(200)
      .json({ status: "success", message: "Interaction supprimée" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Récupérer les interactions d'une ressource
 * @route   GET /api/interactions/ressource/:id
 * @access  Privé (Admin ou propriétaire de la ressource)
 */
export const getRessourceInteractions = async (req: any, res: Response) => {
  try {
    const interactions = await InteractionRepository.findByResourceId(
      req.params.id as string,
    );

    res.status(200).json({
      status: "success",
      results: interactions.length,
      data: { interactions },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc Récupérer les resources save d'un user
 * @route   GET /api/interactions/user/saved
 * @access  Privé (Utilisateur connecté)
 */
export const getUserSavedResources = async (req: any, res: Response) => {
  try {
    const savedResources = await InteractionRepository.getSavedResources(req.user._id);

    res.status(200).json({
      status: "success",
      results: savedResources.length,
      data: { savedResources },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Récupérer les resources favoris d'un user
 * @route   GET /api/interactions/user/favorites
 * @access  Privé (Utilisateur connecté)
 */
export const getUserFavoriteResources = async (req: any, res: Response) => {
  try {
    const favoriteResources = await InteractionRepository.getFavoriteResources(req.user._id);

    res.status(200).json({
      status: "success",
      results: favoriteResources.length,
      data: { favoriteResources },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};