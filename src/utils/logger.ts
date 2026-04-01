import mongoose from 'mongoose';
import Log from '../models/Log.js';

interface LogParams {
    action: string;
    adminId?: string;
    userId?: string;
    articleId?: string;
    details?: string;
}

export const saveLog = async ({ action, adminId, userId, articleId, details }: LogParams) => {
    try {

        const logData: any = {
            action,
            details,
            date: new Date()
        };

        if (adminId) logData.admin = new mongoose.Types.ObjectId(adminId);
        if (userId) logData.user = new mongoose.Types.ObjectId(userId);
        if (articleId) logData.article = new mongoose.Types.ObjectId(articleId);

        await Log.create(logData);

    } catch (error) {
        console.error("❌ Erreur lors de la création du log :", error);
    }
};