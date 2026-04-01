import mongoose, { Schema, Document, type Model } from 'mongoose';

export interface IDiary extends Document {
    user: mongoose.Types.ObjectId;
    baseEmotion: mongoose.Types.ObjectId;
    emotionDetail: mongoose.Types.ObjectId;
    comment: string;
    date: Date;
}

const DiarySchema = new Schema<IDiary>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    baseEmotion: { type: Schema.Types.ObjectId, ref: 'Emotion', required: true },
    emotionDetail: { type: Schema.Types.ObjectId, ref: 'EmotionDetail' },
    comment: { type: String, trim: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

DiarySchema.index({ user: 1, date: -1 });

export default mongoose.model<IDiary>('Diary', DiarySchema);