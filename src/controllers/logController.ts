import type { Request, Response } from 'express';
import Log from '../models/Log.js';

/**
 * @desc    Récupérer tous les logs (Admin uniquement)
 * @route   GET /api/logs
 */
export const getAllLogs = async (req: Request, res: Response) => {
    try {
        const logs = await Log.find()
            .populate('admin', 'firstname lastname')
            .populate('user', 'firstname lastname email')
            .populate('article', 'title')
            .sort('-createdAt'); // Les plus récents en premier

        res.status(200).json({
            status: 'success',
            results: logs.length,
            data: { logs }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};