import type { Request, Response } from 'express';
import Categorie from '../models/Categorie.js';

/**
 * @desc    Récupérer toutes les catégories
 * @route   GET /api/categories
 * @access  Public
 */
export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Categorie.find().sort('name').where('systemStatus').equals('Enabled');
        res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer les catégories même désactivé (Admin)
 * @route   GET /api/categories/all
 * @access  Privé (Admin)
 */
export const getAllCategoriesAdmin = async (req: any, res: Response) => {
    try {
        const categories = await Categorie.find().sort('name');
        res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer une catégorie par ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategory = async (req: Request, res: Response) => {
    try {
        const category = await Categorie.findById(req.params.id).where('systemStatus').equals('Enabled');
        if (!category) {
            return res.status(404).json({ status: 'error', message: "Catégorie non trouvée" });
        }
        res.status(200).json({ status: 'success', data: { category } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: "ID invalide ou erreur serveur" });
    }
};

/**
 * @desc    Créer une nouvelle catégorie
 * @route   POST /api/categories
 * @access  Privé (Admin)
 */
export const createCategory = async (req: any, res: Response) => {
    try {
        const { name } = req.body;
        const newCategory = new Categorie({ name });
        await newCategory.save();
        res.status(201).json({ status: 'success', data: { category: newCategory } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Mettre à jour une catégorie (Admin)
 * @route   PUT /api/categories/:id
 * @access  Privé (Admin)
 */
export const updateCategory = async (req: any, res: Response) => {
    try {
        const category = await Categorie.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!category) {
            return res.status(404).json({ status: 'error', message: "Catégorie non trouvée" });
        }
        res.status(200).json({ status: 'success', data: { category } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc Desactiver une catégorie (Admin)
 * @route PUT /api/categories/:id/disable
 * @access Privé (Admin)
 * */
export const disableCategory = async (req: any, res: Response) => {
    try {
        const category = await Categorie.findById(req.params.id).where('systemStatus').equals('Enabled');
        if (!category) {
            return res.status(404).json({ status: 'error', message: "Catégorie non trouvée" });
        }
        category.systemStatus = 'Disabled';
        await category.save();
        res.status(200).json({ status: 'success', data: { category } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc Activer une catégorie (Admin)
 * @route PUT /api/categories/:id/enable
 * @access Privé (Admin)
 * */
export const enableCategory = async (req: any, res: Response) => {
    try {
        const category = await Categorie.findById(req.params.id).where('systemStatus').equals('Disabled');
        if (!category) {
            return res.status(404).json({ status: 'error', message: "Catégorie non trouvée" });
        }
        category.systemStatus = 'Enabled';
        await category.save();
        res.status(200).json({ status: 'success', data: { category } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};