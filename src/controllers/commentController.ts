import type { Request, Response } from 'express';
import Comment from '../models/Comment.js';
import { GlobalRole } from '../constants/roles.js';

/**
 * @desc    Récupérer les commentaires d'une ressource
 * @route   GET /api/comments/ressource/:id
 * @access  Public
 */
export const getCommentsByRessource = async (req: Request, res: Response) => {
    try {
        const comments = await Comment.find({ ressourceId: req.params.id as any }).sort('-createdAt');
        res.status(200).json({ status: 'success', results: comments.length, data: { comments } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Ajouter un commentaire à une ressource
 * @route   POST /api/comments
 * @access  Privé (Utilisateur connecté)
 */
export const addComment = async (req: any, res: Response) => {
    try {
        const { content, ressourceId } = req.body;
        const newComment = new Comment({
            authorId: req.user._id,
            content,
            ressourceId,
            commentId: req.body.commentId?.toString() || null
        });
        await newComment.save();
        res.status(201).json({ status: 'success', data: { comment: newComment } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer un commentaire (Auteur ou Admin)
 * @route   DELETE /api/comments/:id
 * @access  Privé (Auteur du commentaire ou Admin)
 */
export const deleteComment = async (req: any, res: Response) => {
    try {
        const commentX = await Comment.findById(req.params.id);

        if (!commentX) {
            return res.status(404).json({ status: 'error', message: "Commentaire non trouvé" });
        }
        // Vérification d'autorisation : auteur du commentaire ou admin
        if (commentX.authorId.toString() !== req.user._id.toString() && req.user.role !== GlobalRole.ADMIN) {
            return res.status(403).json({ status: 'error', message: "Non autorisé à supprimer ce commentaire" });
        }

        await commentX.deleteOne();

        res.status(200).json({ status: 'success', message: "Commentaire supprimé" });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Modifier un commentaire (Auteur ou Admin)
 * @route   PATCH /api/comments/:id
 * @access  Privé (Auteur du commentaire ou Admin)
 */
export const updateComment = async (req: any, res: Response) => {
    try {
        const commentX = await Comment.findById(req.params.id);
        if (!commentX) {
            return res.status(404).json({ status: 'error', message: "Commentaire non trouvé" });
        }
        // Vérification d'autorisation : auteur du commentaire ou admin
        if (commentX.authorId.toString() !== req.user._id.toString() && req.user.role !== GlobalRole.ADMIN) {
            return res.status(403).json({ status: 'error', message: "Non autorisé à modifier ce commentaire" });
        }
        commentX.content = req.body.content || commentX.content;
        await commentX.save();
        res.status(200).json({ status: 'success', data: { comment: commentX } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer les commentaires d'un utilisateur 
 * @route   GET /api/comments/user/:id
 * @access  Admin ou propriétaire des commentaires
 */
export const getCommentsByUser = async (req: any, res: Response) => {
    try {
        const comments = await Comment.find({ authorId: req.params.id as any }).sort('-createdAt');

        if (req.user.role !== GlobalRole.ADMIN && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ status: 'error', message: "Non autorisé à voir les commentaires de cet utilisateur" });
        }

        res.status(200).json({ status: 'success', results: comments.length, data: { comments } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer tous les commentaires d'une ressource (ex: lors de la suppression d'une ressource)
 * @route   DELETE /api/comments/ressource/:id
 * @access  Privé (Admin)
 */
export const deleteCommentsByRessource = async (req: any, res: Response) => {
    try {
        await Comment.deleteMany({ ressourceId: req.params.id as any });
        res.status(200).json({ status: 'success', message: "Commentaires de la ressource supprimés" });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer tous les commentaires d'un utilisateur (ex: lors de la désactivation d'un compte)
 * @route   DELETE /api/comments/user/:id
 * @access  Privé (Admin)
 */
export const deleteCommentsByUser = async (req: any, res: Response) => {
    try {
        await Comment.deleteMany({ authorId: req.params.id as any });
        res.status(200).json({ status: 'success', message: "Commentaires de l'utilisateur supprimés" });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer tous les commentaires (Admin uniquement)
 * @route   GET /api/admin/comments
 * @access  Privé (Admin)
 */
export const getAllComments = async (req: any, res: Response) => {
    try {
        const comments = await Comment.find().sort('-createdAt');
        res.status(200).json({ status: 'success', results: comments.length, data: { comments } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};