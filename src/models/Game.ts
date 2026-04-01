import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGame extends Document {
    regles: string;
    difficultes: string;
    age_minimum: number;
    RessourceId: mongoose.Schema.Types.ObjectId;
    systemStatus: 'Enabled' | 'Disabled';
}

const GameSchema = new mongoose.Schema<IGame>({
    regles: { type: String, required: true, trim: true },
    difficultes: { type: String, required: true, trim: true },
    age_minimum: { type: Number, required: true },
    RessourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ressource', required: true },
    systemStatus: { type: String, enum: ['Enabled', 'Disabled'], default: 'Enabled' }
});

const GameModel: Model<IGame> = mongoose.model<IGame>("Game", GameSchema);
export default GameModel;