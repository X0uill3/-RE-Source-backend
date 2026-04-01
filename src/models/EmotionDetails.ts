import mongoose, { Schema, Document, type Model } from 'mongoose';

export interface IEmotionDetails extends Document {
    name: string;
    baseEmotion: mongoose.Types.ObjectId;
    iconUrl?: string;
    color?: string;
    isActive: boolean;
}

const EmotionDetailSchema = new Schema<IEmotionDetails>({
    name: { type: String, required: true },
    baseEmotion: { type: Schema.Types.ObjectId, ref: 'Emotion', required: true },
    iconUrl: { type: String },
    color: { type: String },
    isActive: { type: Boolean, default: true }
});
export const EmotionDetail = mongoose.model<IEmotionDetails>('EmotionDetail', EmotionDetailSchema);