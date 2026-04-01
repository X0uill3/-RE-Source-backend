import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInteraction extends Document {
    UserId: mongoose.Schema.Types.ObjectId;
    date: Date;
}


const InteractionSchema = new mongoose.Schema<IInteraction>({
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    date: {
        type: Date,
        default: Date.now
    }

});

const InteractionModel: Model<IInteraction> = mongoose.model<IInteraction>("Interaction", InteractionSchema);
export default InteractionModel;