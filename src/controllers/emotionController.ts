import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Emotion } from '../models/Emotion.js';
import { EmotionDetail } from '../models/EmotionDetails.js';

/**
 * @desc    Récupérer toutes les émotions de base (Niveau 1)
 * @route   GET /api/emotions
 */
export const getAllBaseEmotions = async (req: Request, res: Response) => {
    try {
        const emotions = await Emotion.find({ isActive: true }).sort('name');
        res.status(200).json({ status: 'success', data: { emotions } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer les détails (Niveau 2) d'une émotion de base
 * @route   GET /api/emotions/:baseId/details
 */
export const getDetailsByBase = async (req: Request, res: Response) => {
    try {
        // On force le type en string pour satisfaire Mongoose
        const baseId = req.params.baseId as string;

        const details = await EmotionDetail.find({
            baseEmotion: new mongoose.Types.ObjectId(baseId)
        }).sort('name');

        res.status(200).json({ status: 'success', data: { details } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer toutes les émotions de base avec leurs détails (Admin uniquement)
 * @route   GET /api/emotions/admin
 */
export const getAllEmotionsWithDetails = async (req: Request, res: Response) => {
    try {
        const emotions = await Emotion.find();
        const details = await EmotionDetail.find().populate('baseEmotion');

        res.status(200).json({ status: 'success', data: { emotions, details } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Ajouter une émotion de base (Admin uniquement)
 */
export const createBaseEmotion = async (req: Request, res: Response) => {
    try {
        const { name, color, iconUrl } = req.body;
        const emotion = await Emotion.create({ name, color, iconUrl });
        res.status(201).json({ status: 'success', data: { emotion } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Ajouter un détail d'émotion (Admin uniquement)
 * @route   POST /api/emotions/details
 */
export const createEmotionDetail = async (req: Request, res: Response) => {
    try {
        const { name, baseEmotion, color, iconUrl } = req.body;

        const base = await Emotion.findById(baseEmotion);
        if (!base) return res.status(404).json({ message: "Émotion de base introuvable" });

        const detail = await EmotionDetail.create({
            name,
            baseEmotion,
            color: color || base.color,
            iconUrl
        });

        res.status(201).json({ status: 'success', data: { detail } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Modifier une émotion de base (Admin uniquement)
 * @route   PATCH /api/emotions/:id
 */
export const updateBaseEmotion = async (req: Request, res: Response) => {
    try {
        const emotion = await Emotion.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!emotion) return res.status(404).json({ message: "Émotion de base introuvable" });

        res.status(200).json({ status: 'success', data: { emotion } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Désactiver une émotion de base (Soft Delete)
 * @route   DELETE /api/emotions/:id
 */
export const deactivateBaseEmotion = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string; // Cast explicite ici

        const emotion = await Emotion.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!emotion) return res.status(404).json({ message: "Émotion de base introuvable" });

        await EmotionDetail.updateMany(
            { baseEmotion: new mongoose.Types.ObjectId(id) },
            { isActive: false }
        );

        res.status(200).json({ status: 'success', message: "Émotion et détails désactivés" });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Modifier un détail d'émotion (Admin uniquement)
 * @route   PATCH /api/emotions/details/:id
 */
export const updateEmotionDetail = async (req: Request, res: Response) => {
    try {
        const detail = await EmotionDetail.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!detail) return res.status(404).json({ message: "Détail d'émotion introuvable" });

        res.status(200).json({ status: 'success', data: { detail } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Désactiver un détail d'émotion (Admin uniquement)
 * @route   DELETE /api/emotions/details/:id
 */
export const deactivateEmotionDetail = async (req: Request, res: Response) => {
    try {
        const detail = await EmotionDetail.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

        if (!detail) return res.status(404).json({ message: "Détail introuvable" });

        res.status(200).json({ status: 'success', message: "Détail d'émotion désactivé" });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};