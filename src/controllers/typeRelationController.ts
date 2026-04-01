import type { Request, Response } from 'express';
import TypeRelation from '../models/TypeRelation.js';

/**
 * @desc    Récupérer tous les types de relations
 * @route   GET /api/type-relations
 * @access  Public  
 * */
export const getAllTypeRelations = async (req: Request, res: Response) => {
    try {
        const typeRelations = await TypeRelation.find().sort('name');
        res.status(200).json({ status: 'success', results: typeRelations.length, data: { typeRelations } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};