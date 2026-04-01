import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRessource extends Document {
    title: string;
    description: string;
    systemStatus: 'Enabled' | 'Disabled';
    visibility: 'Public' | 'Private';
    createdAt: Date;
    updatedAt: Date;
    views: number;
    path_media: string;
    categorie: mongoose.Schema.Types.ObjectId;
    typeRessource: mongoose.Schema.Types.ObjectId;
    typeRelation: mongoose.Schema.Types.ObjectId;
}

const RessourceSchema = new mongoose.Schema<IRessource>({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    systemStatus: {
        type: String,
        enum: ['Enabled', 'Disabled'],
        default: 'Disabled'
    },
    visibility: {
        type: String,
        enum: ['Public', 'Private'],
        default: 'Public'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    },
    path_media: {
        type: String,
        required: false,
        default: ''
    },
    categorie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categorie'
    },
    typeRessource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TypeRessource'
    },
    typeRelation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TypeRelation'
    }
});

const RessourceModel: Model<IRessource> = mongoose.model<IRessource>("Ressource", RessourceSchema);
export default RessourceModel;