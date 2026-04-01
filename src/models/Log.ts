import mongoose, { Schema, Document, type Model } from 'mongoose';

export interface ILog extends Document {
    action: string;
    admin: mongoose.Types.ObjectId;
    user?: mongoose.Types.ObjectId;
    details?: string;
    article?: mongoose.Types.ObjectId;
    date: Date;
}

const LogSchema = new Schema<ILog>({
    action: { type: String, required: true },
    admin: { type: Schema.Types.ObjectId, ref: 'User' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    details: { type: String },
    article: { type: Schema.Types.ObjectId, ref: 'Article' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ILog>('Log', LogSchema);