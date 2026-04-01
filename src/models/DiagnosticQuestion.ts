import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer {
    label: string;
    points: number;
}

export interface IDiagnosticQuestion extends Document {
    test: mongoose.Types.ObjectId;
    text: string;
    isActive: boolean;
    order: number;
    answers: IAnswer[];
}

const AnswerSchema = new Schema<IAnswer>({
    label: { type: String, required: true },
    points: { type: Number, required: true }
});

const DiagnosticQuestionSchema = new Schema<IDiagnosticQuestion>({
    test: { type: Schema.Types.ObjectId, ref: 'DiagnosticTest', required: true },
    text: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    answers: [AnswerSchema]
}, { timestamps: true });

DiagnosticQuestionSchema.index({ test: 1, isActive: 1, order: 1 });

export default mongoose.model<IDiagnosticQuestion>('DiagnosticQuestion', DiagnosticQuestionSchema);