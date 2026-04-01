import type { Request, Response } from 'express';
import Interaction from '../models/Interaction.js';

/**
 * @desc    Enregistrer une interaction (vue, favori, sauvegarde)
 * @route   POST /api/interactions
 * @access  Privé (Utilisateur connecté)
 */
export const recordInteraction = async (req: any, res: Response) => {
    try {
        const { interactionType, ressourceId } = req.body;
        const newInteraction = new Interaction({
            UserId: req.user._id,
            interactionType,
            ressourceId,
            ReceiverId: req.body.ReceiverId || null
        });
        await newInteraction.save();
        res.status(201).json({ status: 'success', data: { interaction: newInteraction } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer les interactions d'un utilisateur
 * @route   GET /api/interactions
 * @access  Privé (Utilisateur connecté)
 */
export const getUserInteractions = async (req: any, res: Response) => {
    try {
        const interactions = await Interaction.find({ UserId: req.user._id }).sort('-date');
        res.status(200).json({ status: 'success', results: interactions.length, data: { interactions } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer une interaction (ex: retirer un favori)
 * @route   DELETE /api/interactions/:id
 * @access  Privé (Utilisateur connecté)
 */
export const deleteInteraction = async (req: any, res: Response) => {
    try {
        const interaction = await Interaction.findOneAndDelete({ _id: req.params.id, UserId: req.user._id });
        if (!interaction) {
            return res.status(404).json({ status: 'error', message: "Interaction non trouvée" });
        }
        res.status(200).json({ status: 'success', message: "Interaction supprimée" });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer les interactions d'une ressource 
 * @route   GET /api/interactions/ressource/:id
 * @access  Privé (Admin ou propriétaire de la ressource)
 */
export const getRessourceInteractions = async (req: any, res: Response) => {
    try {
        const interactions = await Interaction.find({ ressourceId: req.params.id }).sort('-date');
        res.status(200).json({ status: 'success', results: interactions.length, data: { interactions } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};