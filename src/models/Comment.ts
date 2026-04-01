import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
    content: StaticRange;
    date: Date;
}

const CommentSchema = new mongoose.Schema<IComment>({
    content: {
        type: String,
        required: true,
        trim: true,
        defaut: 'Enabled'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const CommentModel: Model<IComment> = mongoose.model<IComment>("Comment", CommentSchema);
export default CommentModel;