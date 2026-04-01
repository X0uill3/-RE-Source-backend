import type { Request, Response } from 'express';
import Resource from '../models/Ressource.js';

/**
 * @desc    Lister les ressources publiques (Citoyen)
 * @route   GET /api/resources
 */
export const getAllResources = async (req: Request, res: Response) => {
    try {
        // On ne récupère que les ressources validées pour le public
        const query = { status: 'Validated', isRestricted: false };
        
        // Filtrage & Tri (Exemple: ?category=emploi&sort=-createdAt)
        const resources = await Resource.find(query)
            .populate('author', 'firstname lastname')
            .sort(req.query.sort ? String(req.query.sort) : '-createdAt');

        res.status(200).json({ status: 'success', results: resources.length, data: { resources } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Lister les ressources restreintes (Citoyen connecté)
 * @route   GET /api/resources/restricted
 */
export const getRestrictedResources = async (req: any, res: Response) => {
    try {
        const resources = await Resource.find({ status: 'Validated' }); // Accès total si connecté
        res.status(200).json({ status: 'success', data: { resources } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Afficher une ressource précise
 * @route   GET /api/resources/:id
 */
export const getResource = async (req: Request, res: Response) => {
    try {
        const resource = await Resource.findById(req.params.id).populate('comments.author', 'firstname');
        if (!resource) return res.status(404).json({ message: "Ressource non trouvée" });
        
        res.status(200).json({ status: 'success', data: { resource } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Créer une ressource (Citoyen & Admin)
 * @route   POST /api/resources
 */
export const createResource = async (req: any, res: Response) => {
    try {
        const data = { ...req.body, author: req.user._id };
        const resource = await Resource.create(data);
        res.status(201).json({ status: 'success', data: { resource } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Modifier une ressource (Citoyen & Admin)
 * @route   PATCH /api/resources/:id    
 */
export const updateResource = async (req: any, res: Response) => {
    try {
        const data = { ...req.body, author: req.user._id };
        const resource = await Resource.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        res.status(200).json({ status: 'success', data: { resource } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Validation d'une ressource (Modérateur)
 * @route   PATCH /api/resources/:id/validate
 */
export const validateResource = async (req: Request, res: Response) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id, 
            { status: 'Validated', validatedAt: Date.now() }, 
            { new: true }
        );
        res.status(200).json({ status: 'success', data: { resource } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer / Suspendre (Admin)
 * @route   DELETE /api/resources/:id
 */
export const deleteResource = async (req: Request, res: Response) => {
    try {
        // On peut soit supprimer, soit passer en statut 'Archived' (plus sûr)
        await Resource.findByIdAndUpdate(req.params.id, { status: 'Archived' });
        res.status(204).json({ status: 'success', data: null });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};