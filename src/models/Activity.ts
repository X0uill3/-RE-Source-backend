import mongoose, { Document, Model, Schema } from "mongoose";

export interface IActivity extends Document {
    deroulement: string;
    materiel_requis: string;
    duree: number;
    RessourceId: mongoose.Schema.Types.ObjectId;
}

const ActivitySchema = new mongoose.Schema<IActivity>({
    deroulement: { type: String, required: true, trim: true },
    materiel_requis: { type: String, required: true, trim: true },
    duree: { type: Number, required: true },
    RessourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ressource', required: true }
});

const ActivityModel: Model<IActivity> = mongoose.model<IActivity>("Activity", ActivitySchema);
export default ActivityModel;