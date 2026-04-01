import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategorie extends Document {
    name: string;
    systemStatus: 'Enabled' | 'Disabled';
    createdAt: Date;
    updatedAt: Date;
}

const CategorieSchema = new mongoose.Schema<ICategorie>({
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

const CategorieModel: Model<ICategorie> = mongoose.model<ICategorie>("Categorie", CategorieSchema);
export default CategorieModel;