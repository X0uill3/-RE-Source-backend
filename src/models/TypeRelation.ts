import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITypeRelation extends Document {
    name: string;
    systemStatus: 'Enabled' | 'Disabled';
    createdAt: Date;
    updatedAt: Date;
}

const TypeRelationSchema = new mongoose.Schema<ITypeRelation>({
    name: { type: String, required: true, trim: true },
    systemStatus: {
        type: String,
        enum: ['Enabled', 'Disabled'],
        default: 'Enabled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const TypeRelationModel: Model<ITypeRelation> = mongoose.model<ITypeRelation>("TypeRelation", TypeRelationSchema);
export default TypeRelationModel;