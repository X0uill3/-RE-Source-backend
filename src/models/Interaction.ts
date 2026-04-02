import mongoose, { Document, Model, Schema } from "mongoose";
import { RessourceInteractionType } from "../constants/interactions.js";

export interface IInteraction extends Document {
    UserId: mongoose.Types.ObjectId;
    date: Date;
    interactionType: RessourceInteractionType;
    ressourceId: mongoose.Types.ObjectId;
    ReceiverId?: mongoose.Types.ObjectId;
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
    },
    ReceiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
});

const InteractionModel: Model<IInteraction> = mongoose.model<IInteraction>("Interaction", InteractionSchema);
export default InteractionModel;