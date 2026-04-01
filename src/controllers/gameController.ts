import type { Request, Response } from 'express';
import Game from '../models/Game.js';

/**
 * @desc    Récupérer tous les jeux (avec peuplement de la ressource si besoin)
 * @route   GET /api/games
 */
export const getAllGames = async (req: Request, res: Response) => {
    try {
        const games = await Game.find().sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: games.length,
            data: { games }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Récupérer un jeu par ID
 * @route   GET /api/games/:id
 */
export const getGame = async (req: Request, res: Response) => {
    try {
        const game = await Game.findById(req.params.id);

        if (!game) {
            return res.status(404).json({ status: 'error', message: "Jeu non trouvé" });
        }

        res.status(200).json({
            status: 'success',
            data: { game }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: "ID invalide ou erreur serveur" });
    }
};

/**
 * @desc    Créer un nouveau jeu
 * @route   POST /api/games
 */
export const createGame = async (req: Request, res: Response) => {
    try {
        // On récupère uniquement les champs définis dans votre interface IGame
        const { regles, difficultes, age_minimum, RessourceId } = req.body;

        const newGame = await Game.create({
            regles,
            difficultes,
            age_minimum,
            RessourceId
        });

        res.status(201).json({
            status: 'success',
            data: { game: newGame }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Modifier un jeu
 * @route   PATCH /api/games/:id
 */
export const updateGame = async (req: Request, res: Response) => {
    try {
        const { regles, difficultes, age_minimum, RessourceId } = req.body;

        const game = await Game.findByIdAndUpdate(
            req.params.id,
            { regles, difficultes, age_minimum, RessourceId },
            { new: true, runValidators: true }
        );

        if (!game) {
            return res.status(404).json({ status: 'error', message: "Jeu non trouvé" });
        }

        res.status(200).json({
            status: 'success',
            data: { game }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Supprimer un jeu
 * @route   DELETE /api/games/:id
 */
export const deleteGame = async (req: Request, res: Response) => {
    try {
        const game = await Game.findByIdAndDelete(req.params.id);

        if (!game) {
            return res.status(404).json({ status: 'error', message: "Jeu non trouvé" });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Désactiver un jeu (Admin)
 * @route   PATCH /api/games/:id/disable
 * @access  Privé (Admin)
 * */
export const disableGame = async (req: Request, res: Response) => {
    try {
        const game = await Game.findById(req.params.id).where('systemStatus').equals('Enabled');
        if (!game) {
            return res.status(404).json({ status: 'error', message: "Jeu non trouvé" });
        }
        game.systemStatus = 'Disabled';
        await game.save();
        res.status(200).json({ status: 'success', data: { game } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * @desc    Activer un jeu (Admin)
 * @route   PATCH /api/games/:id/enable
 * @access  Privé (Admin)
 * */
export const enableGame = async (req: Request, res: Response) => {
    try {
        const game = await Game.findById(req.params.id).where('systemStatus').equals('Disabled');
        if (!game) {
            return res.status(404).json({ status: 'error', message: "Jeu non trouvé" });
        }
        game.systemStatus = 'Enabled';
        await game.save();
        res.status(200).json({ status: 'success', data: { game } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};