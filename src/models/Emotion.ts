import mongoose, { Schema, Document, type Model } from 'mongoose';

export interface IEmotion extends Document {
    name: string;
    iconUrl?: string;
    color?: string;
    isActive: boolean;
}

const EmotionSchema = new Schema<IEmotion>({
    name: { type: String, required: true, unique: true },
    iconUrl: { type: String },
    color: { type: String },
    isActive: { type: Boolean, default: true }
});

export const Emotion = mongoose.model<IEmotion>('Emotion', EmotionSchema);