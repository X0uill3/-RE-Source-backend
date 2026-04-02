import mongoose, { Document, Model, Schema } from "mongoose";
import { GlobalTypeRessource } from "../constants/typeRessource.js";

export interface IRessource extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  systemStatus: "Enabled" | "Disabled";
  visibility: "Public" | "Private";
  createdAt: Date;
  updatedAt: Date;
  views: number;
  path_media: string;
  categorie: mongoose.Types.ObjectId;
  typeRessource: GlobalTypeRessource;
  typeRelation: mongoose.Types.ObjectId;
  start: boolean;
}

const RessourceSchema = new mongoose.Schema<IRessource>({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  systemStatus: {
    type: String,
    enum: ["Enabled", "Disabled"],
    default: "Disabled",
  },
  visibility: {
    type: String,
    enum: ["Public", "Private"],
    default: "Public",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  views: {
    type: Number,
    default: 0,
  },
  path_media: {
    type: String,
    required: false,
    default: "",
  },
  categorie: {
    type: mongoose.Types.ObjectId,
    ref: "Categorie",
  },
  typeRessource: {
    type: String,
    enum: Object.values(GlobalTypeRessource),
  },
  typeRelation: {
    type: mongoose.Types.ObjectId,
    ref: "TypeRelation",
  },
  start: {
    type: Boolean,
    default: false,
  },
});

const RessourceModel: Model<IRessource> = mongoose.model<IRessource>(
  "Ressource",
  RessourceSchema,
);
export default RessourceModel;
