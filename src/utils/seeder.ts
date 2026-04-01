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

async function seed() {
    try {
        console.log('⏳ Connexion à MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connecté');

        console.log('🧹 Nettoyage de la base de données...');
        await UserModel.deleteMany({});
        await Emotion.deleteMany({});
        await EmotionDetail.deleteMany({});
        await ArticleModel.deleteMany({});
        await DiaryModel.deleteMany({});

        // --- USERS ---
        console.log('🌱 Création des utilisateurs...');
        const adminUser = new UserModel({
            firstname: 'Alice',
            lastname: 'Admin',
            email: 'admin@test.com',
            password: 'password123',
            role: GlobalRole.ADMIN, // Assurez-vous d'exporter GlobalRole.ADMIN
        });
        await adminUser.save(); // Utilise le save() pour déclencher le hash bcrypt

        const normalUser = new UserModel({
            firstname: 'Bob',
            lastname: 'User',
            email: 'user@test.com',
            password: 'password123',
            role: GlobalRole.USER,
        });
        await normalUser.save();

        // --- EMOTIONS ---
        console.log('🎭 Création des émotions (avec icones lucide-react)...');
        const emotions = await Emotion.insertMany([
            { name: 'Joie', iconUrl: 'Smile', color: '#FFD700', isActive: true },
            { name: 'Tristesse', iconUrl: 'Frown', color: '#4682B4', isActive: true },
            { name: 'Colère', iconUrl: 'Flame', color: '#FF4500', isActive: true }
        ]);

        const joy = emotions[0]!;
        const sadness = emotions[1]!;

        // --- EMOTIONS DETAILS ---
        const emotionDetails = await EmotionDetail.insertMany([
            { name: 'Heureux', baseEmotion: joy._id, iconUrl: 'Laugh', color: '#FFA500', isActive: true },
            { name: 'Serein', baseEmotion: joy._id, iconUrl: 'Sun', color: '#FFD700', isActive: true },
            { name: 'Déprimé', baseEmotion: sadness._id, iconUrl: 'CloudRain', color: '#1E90FF', isActive: true }
        ]);

        // --- ARTICLES ---
        console.log('📝 Création des articles...');
        await ArticleModel.insertMany([
            {
                title: 'Comprendre ses émotions',
                content: 'Il est important de prendre le temps de comprendre ce que l’on ressent...',
                category: ArticleCategory.GENERAL, // Assurez-vous de l'exporter dans constants/categories.js
                author: adminUser._id,
                isActive: true
            },
            {
                title: 'Gérer la colère',
                content: 'Voici 5 techniques de respiration pour faire redescendre la pression...',
                category: ArticleCategory.GENERAL,
                author: adminUser._id,
                isActive: true
            }
        ]);

        // --- DIARY ---
        console.log('📖 Création du journal...');
        await DiaryModel.create({
            user: normalUser._id,
            baseEmotion: joy._id,
            emotionDetail: emotionDetails[0]!._id, // Heureux
            comment: 'Aujourd\'hui j\'ai passé une excellente journée avec mes amis !',
        });

        console.log('🎉 Seeding terminé avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors du seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté');
        process.exit(0);
    }
}

seed();