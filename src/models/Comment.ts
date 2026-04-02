import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
    content: string;
    date: Date;
    authorId: mongoose.Types.ObjectId;
    ressourceId: mongoose.Types.ObjectId;
    commentId?: mongoose.Types.ObjectId;
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
    authorId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ressourceId: {
        type: mongoose.Types.ObjectId,
        ref: 'Ressource',
        required: true
    },
    commentId: {
        type: mongoose.Types.ObjectId,
        ref: 'Comment',
        default: null
    }

});

CommentSchema.pre('deleteOne', async function (next) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
        await mongoose.model("Comment").deleteMany({ commentId: docToUpdate._id });
    }
    return;
});

const CommentModel: Model<IComment> = mongoose.model<IComment>("Comment", CommentSchema);
export default CommentModel;