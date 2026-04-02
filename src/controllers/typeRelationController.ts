import type { Request, Response } from "express";
import TypeRelationRepository from "../repositories/typeRelationRepository.js";

/**
 * @desc Lister les types de relation actives
 * @route GET /api/typeRelation
 */
export const getAllTypeRelation = async (req: Request, res: Response) => {
  try {
    const typeRelations = await TypeRelationRepository.findAll({
      systemStatus: "Enabled",
    });
    res
      .status(200)
      .json({
        status: "success",
        results: typeRelations.length,
        data: { typeRelations },
      });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc Afficher un type de relation précis
 * @route GET /api/typeRelation/:id
 * @access Public
 */
export const getTypeRelation = async (req: Request, res: Response) => {
  try {
    const typeRelation = await TypeRelationRepository.findById(
      req.params.id as string,
    );
    if (!typeRelation) {
      return res
        .status(404)
        .json({ status: "error", message: "Type de relation non trouvé" });
    }
    res.status(200).json({ status: "success", data: { typeRelation } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc Lister tous les types de relation (Admin)
 * @route GET /api/typeRelation/all
 * @access Privé (Admin)
 */
export const getAllTypeRelationAdmin = async (req: any, res: Response) => {
  try {
    const typeRelations = await TypeRelationRepository.findAll();
    res
      .status(200)
      .json({
        status: "success",
        results: typeRelations.length,
        data: { typeRelations },
      });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc Créer un type de relation
 * @route POST /api/typeRelation
 * @access Admin
 */
export const createTypeRelation = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const newTypeRelation = await TypeRelationRepository.create({
      name,
      description,
    });
    res
      .status(201)
      .json({ status: "success", data: { typeRelation: newTypeRelation } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc Mettre à jour un type de relation
 * @route PUT /api/typeRelation/:id
 * @access Admin
 */
export const updateTypeRelation = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const updatedTypeRelation =
      await TypeRelationRepository.findOneAndUpdateByStatus(
        req.params.id as string,
        "Enabled",
        { name, description },
      );

    if (!updatedTypeRelation) {
      return res
        .status(404)
        .json({
          status: "error",
          message: "Type de relation non trouvé ou désactivé",
        });
    }
    res
      .status(200)
      .json({ status: "success", data: { typeRelation: updatedTypeRelation } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc Désactiver un type de relation
 * @route PUT /api/typeRelation/:id/disable
 * @access Admin
 */
export const disableTypeRelation = async (req: Request, res: Response) => {
  try {
    const deletedTypeRelation =
      await TypeRelationRepository.findOneAndUpdateByStatus(
        req.params.id as string,
        "Enabled",
        { systemStatus: "Disabled" },
      );

    if (!deletedTypeRelation) {
      return res
        .status(404)
        .json({
          status: "error",
          message: "Type de relation non trouvé ou déjà désactivé",
        });
    }
    res
      .status(200)
      .json({
        status: "success",
        message: "Type de relation désactivé avec succès",
      });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc Réactiver un type de relation
 * @route PUT /api/typeRelation/:id/enable
 * @access Admin
 */
export const enableTypeRelation = async (req: Request, res: Response) => {
  try {
    const enabledTypeRelation =
      await TypeRelationRepository.findOneAndUpdateByStatus(
        req.params.id as string,
        "Disabled",
        { systemStatus: "Enabled" },
      );

    if (!enabledTypeRelation) {
      return res
        .status(404)
        .json({
          status: "error",
          message: "Type de relation non trouvé ou déjà activé",
        });
    }
    res
      .status(200)
      .json({
        status: "success",
        message: "Type de relation activé avec succès",
      });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
