import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITypeRessource extends Document {
    name: string;
    systemStatus: 'Enabled' | 'Disabled';
    createdAt: Date;
    updatedAt: Date;
}

const TypeRessourceSchema = new mongoose.Schema<ITypeRessource>({
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

const TypeRessourceModel: Model<ITypeRessource> = mongoose.model<ITypeRessource>("TypeRessource", TypeRessourceSchema);
export default TypeRessourceModel;