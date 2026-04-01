import mongoose, { Schema, Document, type Model } from 'mongoose';
import { ArticleCategory } from '../constants/categories.js';

export interface IArticle extends Document {
    title: string;
    content: string;
    category: ArticleCategory;
    imageUrl?: string;
    author: mongoose.Types.ObjectId;
    publishedAt: Date;
    isActive: boolean;
}

const ArticleSchema = new Schema<IArticle>({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, enum: ArticleCategory, default: ArticleCategory.GENERAL },
    imageUrl: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IArticle>('Article', ArticleSchema);