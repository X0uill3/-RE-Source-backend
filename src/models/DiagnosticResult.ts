import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnosticResult extends Document {
    user: mongoose.Types.ObjectId;
    test: mongoose.Types.ObjectId;
    score: number;
    createdAt: Date;
    updatedAt: Date;
}

const DiagnosticResultSchema = new Schema<IDiagnosticResult>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    test: { type: Schema.Types.ObjectId, ref: 'DiagnosticTest', required: true },
    score: { type: Number, required: true }
}, { timestamps: true });

DiagnosticResultSchema.index({ user: 1, test: 1, createdAt: -1 });

export default mongoose.model<IDiagnosticResult>('DiagnosticResult', DiagnosticResultSchema);