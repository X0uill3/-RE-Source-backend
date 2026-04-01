import mongoose from 'mongoose';
import UserModel from '../models/User.js';
import { Emotion } from '../models/Emotion.js';
import { EmotionDetail } from '../models/EmotionDetails.js';
import ArticleModel from '../models/Articles.js';
import DiaryModel from '../models/Diary.js';
import { GlobalRole } from '../constants/roles.js';
import { ArticleCategory } from '../constants/categories.js';

import dotenv from 'dotenv';

dotenv.config();

// Remplacez si nécessaire par la variable d'environnement ou l'URL exacte présente dans votre index.ts
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cda_db';

async function change() {
    try {
        console.log('⏳ Connexion à MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connecté');
        await changePassword('69a957060afeab64e40a88ad', 'password123');

        // Ferme la connexion après l'opération
        await mongoose.disconnect();
        console.log('✅ Opération terminée, connexion fermée');

    } catch (error) {
        console.error('Erreur de connexion à MongoDB :', error);
        process.exit(1);
    }
};

export const changePassword = async (userId: string, newPassword: string) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        user.password = newPassword; // Le setter de password dans le modèle User va automatiquement hasher le mot de passe
        await user.save();
        console.log('Mot de passe mis à jour avec succès');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du mot de passe :', error);
        throw error;
    }
};

change();