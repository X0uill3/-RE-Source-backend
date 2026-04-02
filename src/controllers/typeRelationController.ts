import type { Request, Response } from "express";
import TypeRelation from '../models/TypeRelation.js'
import { GlobalRole } from "../constants/roles.js";

/**
 * @desc Lister les types de relation actives
 * @route GET /api/typeRelation
 */
export const getAllTypeRelation = async (req: Request, res: Response) => {
    try {
        const typeRelations = await TypeRelation.find({ systemStatus: "Enabled" }).sort("-createdAt");
        res.status(200).json({ status: "success", results: typeRelations.length, data: { typeRelations } });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

/**
 * @desc Afficher un type de relation précis
 * @route GET /api/typeRelation/:id
 * @access Public
 */
export const getTypeRelation = async (req: Request, res: Response) => {
    try {
        const typeRelation = await TypeRelation.findById(req.params.id);
        if (!typeRelation) {
            return res.status(404).json({ status: "error", message: "Type de relation non trouvé" });
        }
        res.status(200).json({ status: "success", data: { typeRelation } });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

/**
 * @desc Lister tous les types de relation (Admin)
 * @route GET /api/typeRelation/all
 * @access Privé (Admin)
 */
export const getAllTypeRelationAdmin = async (req: any, res: Response) => {
    try {
        const typeRelations = await TypeRelation.find().sort("-createdAt");
        res.status(200).json({ status: "success", results: typeRelations.length, data: { typeRelations } });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

/**
 * @desc Créer un type de relation
 * @route POST /api/typeRelation
 * @access Admin
 */
export const createTypeRelation = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const newTypeRelation = await TypeRelation.create({ name, description });
        res.status(201).json({ status: "success", data: { typeRelation: newTypeRelation } });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

/**
 * @desc Mettre à jour un type de relation
 * @route PUT /api/typeRelation/:id
 * @access Admin
 */
export const updateTypeRelation = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const updatedTypeRelation = await TypeRelation.findOneAndUpdate(
            { _id: req.params.id as any, systemStatus: "Enabled" },
            { name, description, updatedAt: new Date() },
            { new: true }
        );
        if (!updatedTypeRelation) {
            return res.status(404).json({ status: "error", message: "Type de relation non trouvé ou désactivé" });
        }
        res.status(200).json({ status: "success", data: { typeRelation: updatedTypeRelation } });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

/**
 * @desc Désactiver un type de relation
 * @route PUT /api/typeRelation/:id/disable
 * @access Admin
 */
export const disableTypeRelation = async (req: Request, res: Response) => {
    try {
        const deletedTypeRelation = await TypeRelation.findOneAndUpdate(
            { _id: req.params.id as any, systemStatus: "Enabled" },
            { systemStatus: "Disabled", updatedAt: new Date() },
            { new: true }
        );
        if (!deletedTypeRelation) {
            return res.status(404).json({ status: "error", message: "Type de relation non trouvé ou déjà désactivé" });
        }
        res.status(200).json({ status: "success", message: "Type de relation désactivé avec succès" });
    } catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

/**
 * @desc Réactiver un type de relation
 * @route PUT /api/typeRelation/:id/enable
 * @access Admin
 */
export const enableTypeRelation = async (req: Request, res: Response) => {
    try {
        const enabledTypeRelation = await TypeRelation.findOneAndUpdate(
            { _id: req.params.id as any, systemStatus: "Disabled" },
            { systemStatus: "Enabled", updatedAt: new Date() },
            { new: true }
        );
        if (!enabledTypeRelation) {
            return res.status(404).json({ status: "error", message: "Type de relation non trouvé ou déjà activé" });
        }
        res.status(200).json({ status: "success", message: "Type de relation activé avec succès" });
    }
    catch (error: any) {
        res.status(500).json({ status: "error", message: error.message });
    }
}