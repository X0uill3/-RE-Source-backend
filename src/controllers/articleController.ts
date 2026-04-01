import type { Request, Response } from 'express';
import Article from '../models/Articles.js';
import { ArticleCategory } from '../constants/categories.js';
import { saveLog } from '../utils/logger.js';
import { GlobalRole } from '../constants/roles.js';

interface AuthRequest extends Request {
    user?: any;
}

/**
 * @desc    Récupérer tous les articles (Public)
 * @route   GET /api/articles
 */
export const getAllArticles = async (req: AuthRequest, res: Response) => {
    try {
        const query: any = {};

        query.isActive = true;

        // On récupère les articles, triés par date de publication décroissante
        const articles = await Article.find(query)
            .populate('author', 'firstname lastname') // Jointure pour afficher l'auteur
            .sort('-publishedAt');

        res.status(200).json({
            status: 'success',
            results: articles.length,
            data: { articles }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer tous les articles (Admin - inclut les inactifs)
 * @route   GET /api/articles/admin
 */
export const getAllArticlesAdmin = async (req: Request, res: Response) => {
    try {
        // On récupère les articles, triés par date de publication décroissante
        const articles = await Article.find()
            .populate('author', 'firstname lastname')
            .sort('-publishedAt');

        res.status(200).json({
            status: 'success',
            results: articles.length,
            data: { articles }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};


/**
 * @desc    Récupérer un article par ID (Public)
 * @route   GET /api/articles/:id
 */
export const getArticleById = async (req: AuthRequest, res: Response) => {
    try {
        const query: any = { _id: req.params.id };

        // Si l'utilisateur n'est pas un admin, on ne montre que les articles actifs
        if (req.user?.role !== GlobalRole.ADMIN) {
            query.isActive = true;
        }

        const article = await Article.findOne(query)
            .populate('author', 'firstname lastname');
        if (!article) {
            return res.status(404).json({ status: 'error', message: 'Article non trouvé' });
        }
        res.status(200).json({ status: 'success', data: { article } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Créer un nouvel article (Admin uniquement)
 * @route   POST /api/articles
 */
export const createArticle = async (req: any, res: Response) => {
    try {
        const { title, content, category, imageUrl } = req.body;

        const newArticle = await Article.create({
            title,
            content,
            category: category || ArticleCategory.GENERAL,
            imageUrl,
            author: req.user._id // L'ID vient du middleware 'protect'
        });

        await saveLog({
            action: 'ARTICLE_CREATED',
            adminId: req.user._id.toString(),
            articleId: newArticle._id.toString(),
            details: `Article "${newArticle.title}" créé par l'administrateur.`
        });

        res.status(201).json({
            status: 'success',
            data: { article: newArticle }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Modifier un article (Admin uniquement)
 * @route   PATCH /api/articles/:id
 */
export const updateArticle = async (req: any, res: Response) => {
    try {
        const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!article) {
            return res.status(404).json({ message: "Article non trouvé" });
        }

        await saveLog({
            action: 'ARTICLE_UPDATED',
            adminId: req.user._id.toString(),
            articleId: article._id.toString(),
            details: `Article "${article.title}" mis à jour par l'administrateur.`
        });

        res.status(200).json({ status: 'success', data: { article } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer/Désactiver un article (Admin uniquement)
 */
export const deleteArticle = async (req: any, res: Response) => {
    try {
        const article = await Article.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

        if (!article) {
            return res.status(404).json({ message: "Article non trouvé" });
        }

        await saveLog({
            action: 'ARTICLE_DEACTIVATED',
            adminId: req.user._id.toString(),
            articleId: article._id.toString(),
            details: `Article "${article.title}" desactivé par l'administrateur.`
        });

        res.send(204); // Succès sans contenu
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Activer un article (Admin uniquement)
 * @route   PATCH /api/articles/:id/activate
 */
export const activateArticle = async (req: any, res: Response) => {
    try {
        const article = await Article.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        if (!article) {
            return res.status(404).json({ message: "Article non trouvé" });
        }

        await saveLog({
            action: 'ARTICLE_ACTIVATED',
            adminId: req.user._id.toString(),
            articleId: article._id.toString(),
            details: `Article "${article.title}" activé par l'administrateur.`
        });

        res.status(200).json({ status: 'success', data: { article } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};