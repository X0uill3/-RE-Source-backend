import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
    content: StaticRange;
    date: Date;
    systemStatus: 'Enabled' | 'Disabled';
    authorId: mongoose.Schema.Types.ObjectId;
    ressourceId: mongoose.Schema.Types.ObjectId;
    commentId?: mongoose.Schema.Types.ObjectId;
}

const CommentSchema = new mongoose.Schema<IComment>({
    content: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now
    },
    systemStatus: {
        type: String,
        enum: ['Enabled', 'Disabled'],
        default: 'Enabled'
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ressourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ressource',
        required: true
    },
    commentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    }

});

const CommentModel: Model<IComment> = mongoose.model<IComment>("Comment", CommentSchema);
export default CommentModel;