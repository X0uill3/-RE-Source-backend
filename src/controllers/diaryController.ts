import type { Response } from 'express';
import Diary from '../models/Diary.js';
import { Emotion } from '../models/Emotion.js';
import { EmotionDetail } from '../models/EmotionDetails.js';

/**
 * @desc    Ajouter une entrée au journal (Utilisateur connecté)
 * @route   POST /api/diary
 * @access  Private
 */
export const createEntry = async (req: any, res: Response) => {
    try {
        const { baseEmotionId, emotionDetailId, comment, date } = req.body;

        // 1. Validation du Niveau 1 (Obligatoire)
        const base = await Emotion.findById(baseEmotionId);
        if (!base) {
            return res.status(400).json({ message: "L'émotion de base est obligatoire et doit être valide." });
        }

        // 2. Validation du Niveau 2 (Optionnel)
        if (emotionDetailId) {
            const detail = await EmotionDetail.findById(emotionDetailId);
            if (!detail || detail.baseEmotion.toString() !== baseEmotionId) {
                return res.status(400).json({ message: "Le détail d'émotion ne correspond pas à l'émotion de base choisie." });
            }
        }

        // 3. Création de l'entrée 
        const newEntry = await Diary.create({
            user: req.user._id,
            baseEmotion: baseEmotionId,
            emotionDetail: emotionDetailId || null,
            comment,
            date: date || Date.now()
        });

        res.status(201).json({ status: 'success', data: { entry: newEntry } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Afficher le journal de bord (Utilisateur connecté) 
 * @route   GET /api/diary
 */
export const getMyEntries = async (req: any, res: Response) => {
    try {
        const entries = await Diary.find({ user: req.user._id })
            .populate('baseEmotion') // Niveau 1
            .populate('emotionDetail') // Niveau 2
            .sort('-date');

        res.status(200).json({
            status: 'success',
            results: entries.length,
            data: { entries }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Visualiser un rapport d'émotion sur une période 
 * @route   GET /api/diary/report?period=week|month|year
 */
export const getEmotionReport = async (req: any, res: Response) => {
    try {
        const { period } = req.query;
        let startDate = new Date();

        // Calcul de la période demandée
        if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
        else startDate.setDate(startDate.getDate() - 30); // Par défaut 1 mois

        // Agrégation pour grouper par émotion de base (Niveau 1)
        const stats = await Diary.aggregate([
            { $match: { user: req.user._id, date: { $gte: startDate } } },
            {
                $lookup: {
                    from: 'emotions', // Nom de la collection des émotions de base
                    localField: 'baseEmotion',
                    foreignField: '_id',
                    as: 'emotionInfo'
                }
            },
            { $unwind: '$emotionInfo' },
            { $group: { _id: '$emotionInfo.name', count: { $sum: 1 }, color: { $first: '$emotionInfo.color' } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({ status: 'success', data: { stats } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer un item du journal 
 */
export const deleteEntry = async (req: any, res: Response) => {
    try {
        const entry = await Diary.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!entry) return res.status(404).json({ message: "Entrée introuvable ou non autorisée." });

        res.status(204).json({ status: 'success', data: null });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};