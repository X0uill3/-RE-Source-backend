import mongoose, { Schema, Document } from 'mongoose';

export interface IDiagnosticRule {
    minScore: number;
    maxScore: number;
    title: string;
    description: string;
    color: string;
}

export interface IDiagnosticTest extends Document {
    title: string;
    description: string;
    isActive: boolean;
    rules: IDiagnosticRule[]; // Les différents résultats possibles selon le score
}

const RuleSchema = new Schema<IDiagnosticRule>({
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    color: { type: String, default: '#8BA889' }
});

const DiagnosticTestSchema = new Schema<IDiagnosticTest>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    rules: [RuleSchema]
}, { timestamps: true });

export default mongoose.model<IDiagnosticTest>('DiagnosticTest', DiagnosticTestSchema);