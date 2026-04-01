import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import User from '../models/User.js';
import { GlobalRole } from '../constants/roles.js';

// Fonction pour générer le Token (Sécurité demandée)
const signToken = (id: string): string => {
    const secret = process.env.JWT_SECRET;

    // Sécurité : on s'assure que le secret est présent [cite: 185]
    if (!secret) {
        throw new Error('La variable d\'environnement JWT_SECRET n\'est pas définie');
    }

    const options: SignOptions = {
        // Cast en 'any' ou type spécifique pour contourner 'exactOptionalPropertyTypes'
        expiresIn: (process.env.JWT_EXPIRES_IN as any) || '90d'
    };

    return jwt.sign({ id }, secret, options);
};

export const signup = async (req: Request, res: Response) => {
    try {
        const { firstname, lastname, email, password, birthdate } = req.body;

        const newUser = await User.create({
            firstname,
            lastname,
            email,
            password,
            birthdate,
            role: GlobalRole.USER
        });

        const token = signToken(newUser._id.toString());

        delete (newUser as any).password;

        res.status(201).json({
            status: 'success',
            token,
            data: { user: newUser }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Vérifier si l'email et le mot de passe existent
        if (!email || !password) {
            return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe' });
        }

        // 2. Vérifier si l'utilisateur existe ET si le mot de passe est correct
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // 3. Vérifier si le compte n'est pas désactivé (Exigence Admin) 
        if (user.systemStatus === 'Disabled') {
            return res.status(403).json({ message: 'Ce compte a été désactivé par un administrateur' });
        }

        const token = signToken(user._id.toString());
        const userResponse = user.toObject();
        delete (userResponse as any).password;

        res.status(200).json({ status: 'success', token, data: { user: userResponse } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};