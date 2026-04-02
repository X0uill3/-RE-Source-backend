import type { Request, Response } from "express";
import CommentRepository from "../repositories/commentRepository.js";
import { GlobalRole } from "../constants/roles.js";

/**
 * @desc    Récupérer les commentaires d'une ressource
 * @route   GET /api/comments/ressource/:id
 * @access  Public
 */
export const getCommentsByRessource = async (req: Request, res: Response) => {
  try {
    const comments = await CommentRepository.findByResourceId(
      req.params.id as string,
    );

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: { comments },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Ajouter un commentaire à une ressource
 * @route   POST /api/comments
 * @access  Privé (Utilisateur connecté)
 */
export const addComment = async (req: any, res: Response) => {
  try {
    const { content, ressourceId, commentId } = req.body;

    const newComment = await CommentRepository.create({
      authorId: req.user._id,
      content,
      ressourceId,
      commentId: commentId?.toString() || null,
    });

    res.status(201).json({
      status: "success",
      data: { comment: newComment },
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Supprimer un commentaire (Auteur ou Admin)
 * @route   DELETE /api/comments/:id
 * @access  Privé (Auteur du commentaire ou Admin)
 */
export const deleteComment = async (req: any, res: Response) => {
  try {
    const comment = await CommentRepository.findById(req.params.id as string);

    if (!comment) {
      return res
        .status(404)
        .json({ status: "error", message: "Commentaire non trouvé" });
    }

    if (
      comment.authorId.toString() !== req.user._id.toString() &&
      req.user.role !== GlobalRole.ADMIN
    ) {
      return res.status(403).json({
        status: "error",
        message: "Non autorisé à supprimer ce commentaire",
      });
    }

    // Utilisation de deleteOne sur l'instance pour déclencher le middleware de cascade (suppression des réponses)
    await comment.deleteOne();

    res.status(200).json({
      status: "success",
      message: "Commentaire et ses réponses supprimés",
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Modifier un commentaire (Auteur ou Admin)
 * @route   PATCH /api/comments/:id
 * @access  Privé (Auteur du commentaire ou Admin)
 */
export const updateComment = async (req: any, res: Response) => {
  try {
    const comment = await CommentRepository.findById(req.params.id as string);

    if (!comment) {
      return res
        .status(404)
        .json({ status: "error", message: "Commentaire non trouvé" });
    }

    if (
      comment.authorId.toString() !== req.user._id.toString() &&
      req.user.role !== GlobalRole.ADMIN
    ) {
      return res.status(403).json({
        status: "error",
        message: "Non autorisé à modifier ce commentaire",
      });
    }

    comment.content = req.body.content || comment.content;

    // Sauvegarde via le repository
    await CommentRepository.save(comment);

    res.status(200).json({ status: "success", data: { comment } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Récupérer les commentaires d'un utilisateur 
 * @route   GET /api/comments/user/:id
 * @access  Admin ou propriétaire des commentaires
 */
export const getCommentsByUser = async (req: any, res: Response) => {
  try {
    const userId = req.params.id as string;

    // Sécurité : Seul l'admin ou l'utilisateur lui-même peut voir sa liste complète
    if (
      req.user.role !== GlobalRole.ADMIN &&
      req.user._id.toString() !== userId
    ) {
      return res.status(403).json({
        status: "error",
        message: "Non autorisé à voir les commentaires de cet utilisateur",
      });
    }

    const comments = await CommentRepository.findByUserId(userId);

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: { comments },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Supprimer tous les commentaires d'une ressource (ex: lors de la suppression d'une ressource)
 * @route   DELETE /api/comments/ressource/:id
 * @access  Privé (Admin)
 */
export const deleteCommentsByRessource = async (req: any, res: Response) => {
  try {
    await CommentRepository.deleteManyByResourceId(req.params.id as string);

    res.status(200).json({
      status: "success",
      message: "Commentaires de la ressource supprimés",
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Supprimer tous les commentaires d'un utilisateur (ex: lors de la désactivation d'un compte)
 * @route   DELETE /api/comments/user/:id
 * @access  Privé (Admin)
 */
export const deleteCommentsByUser = async (req: any, res: Response) => {
  try {
    await CommentRepository.deleteManyByUserId(req.params.id as string);

    res.status(200).json({
      status: "success",
      message: "Commentaires de l'utilisateur supprimés",
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Récupérer tous les commentaires (Modération)
 * @route   GET /api/admin/comments
 * @access  Privé (Admin)
 */
export const getAllComments = async (req: any, res: Response) => {
  try {
    const comments = await CommentRepository.findAll();

    res.status(200).json({
      status: "success",
      results: comments.length,
      data: { comments },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
