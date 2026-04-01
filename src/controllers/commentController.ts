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
            UserId: req.user._id,
            content,
            ressourceId
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