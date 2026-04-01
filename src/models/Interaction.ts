import mongoose, { Document, Model, Schema } from "mongoose";
import { RessourceInteractionType } from "../constants/interactions.js";

export interface IInteraction extends Document {
    UserId: mongoose.Schema.Types.ObjectId;
    date: Date;
    interactionType: RessourceInteractionType;
    ressourceId: mongoose.Schema.Types.ObjectId;
}


const InteractionSchema = new mongoose.Schema<IInteraction>({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    date: {
        type: Date,
        default: Date.now
    },
    interactionType: {
        type: String,
        enum: Object.values(RessourceInteractionType),
        required: true
    },
    ressourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ressource',
        required: true
    }
});

const InteractionModel: Model<IInteraction> = mongoose.model<IInteraction>("Interaction", InteractionSchema);
export default InteractionModel;