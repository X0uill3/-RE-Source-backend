import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { GlobalRole } from '../constants/roles.js';

// Extension locale du type Request pour éviter le "any" et gagner des points en qualité
interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

            // On injecte l'utilisateur (sans son mot de passe) dans la requête [cite: 183]
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: "Utilisateur introuvable" });
            }

            // Sécurité supplémentaire : Vérifier si le compte n'est pas désactivé [cite: 106, 334]
            if (req.user.systemStatus === 'Disabled') {
                return res.status(403).json({ message: "Compte désactivé" });
            }

            next();
        } catch (error) {
            res.status(401).json({ message: "Non autorisé, token invalide" });
        }
    } else {
        res.status(401).json({ message: "Non autorisé, aucun token" });
    }
};

export const softProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            req.user = await User.findById(decoded.id).select('-password');

            if (req.user && req.user.systemStatus === 'Disabled') {
                return res.status(403).json({ message: "Compte désactivé" });
            }
        } catch (error) {
            // En cas d'erreur de token (invalide, expiré), on traite comme un invité
            req.user = { role: GlobalRole.GUEST };
        }
    } else {
        // Pas de token, on traite comme un invité
        req.user = { role: GlobalRole.GUEST };
    }

    next();
};

export const checkRole = (allowedRoles: GlobalRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`
            });
        }
        next();
    };
};