import type { Request, Response } from 'express';
import Activity from '../models/Activity.js';

/**
 * @desc    Récupérer toutes les activités
 * @route   GET /api/activities
 */
export const getAllActivities = async (req: Request, res: Response) => {
    try {
        const activities = await Activity.find().sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: activities.length,
            data: { activities }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer une activité par ID
 * @route   GET /api/activities/:id
 */
export const getActivity = async (req: Request, res: Response) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({ status: 'error', message: "Activité non trouvée" });
        }

        res.status(200).json({
            status: 'success',
            data: { activity }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: "ID invalide ou erreur serveur" });
    }
};

/**
 * @desc    Créer une nouvelle activité
 * @route   POST /api/activities
 */
export const createActivity = async (req: Request, res: Response) => {
    try {
        const { deroulement, materiel_requis, duree, RessourceId } = req.body;

        const newActivity = await Activity.create({
            deroulement,
            materiel_requis,
            duree,
            RessourceId
        });

        res.status(201).json({
            status: 'success',
            data: { activity: newActivity }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Modifier une activité
 * @route   PATCH /api/activities/:id
 */
export const updateActivity = async (req: Request, res: Response) => {
    try {
        const { deroulement, materiel_requis, duree, RessourceId } = req.body;

        const activity = await Activity.findByIdAndUpdate(
            req.params.id,
            { deroulement, materiel_requis, duree, RessourceId },
            { new: true, runValidators: true }
        );

        if (!activity) {
            return res.status(404).json({ status: 'error', message: "Activité non trouvée" });
        }

        res.status(200).json({
            status: 'success',
            data: { activity }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer une activité
 * @route   DELETE /api/activities/:id
 */
export const deleteActivity = async (req: Request, res: Response) => {
    try {
        const activity = await Activity.findByIdAndDelete(req.params.id);

        if (!activity) {
            return res.status(404).json({ status: 'error', message: "Activité non trouvée" });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Désactiver une activité (Admin)
 * @route   PATCH /api/activities/:id/disable
 * @access  Privé (Admin)
 * */
export const disableActivity = async (req: Request, res: Response) => {
    try {
        const activity = await Activity.findById(req.params.id).where('systemStatus').equals('Enabled');
        if (!activity) {
            return res.status(404).json({ status: 'error', message: "Activité non trouvée" });
        }
        activity.systemStatus = 'Disabled';
        await activity.save();
        res.status(200).json({ status: 'success', data: { activity } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Activer une activité (Admin)
 * @route   PATCH /api/activities/:id/enable
 * @access  Privé (Admin)
 * */
export const enableActivity = async (req: Request, res: Response) => {
    try {
        const activity = await Activity.findById(req.params.id).where('systemStatus').equals('Disabled');
        if (!activity) {
            return res.status(404).json({ status: 'error', message: "Activité non trouvée" });
        }
        activity.systemStatus = 'Enabled';
        await activity.save();
        res.status(200).json({ status: 'success', data: { activity } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};