import CommentModel, { type IComment } from "../models/Comment.js";

class CommentRepository {
  async findByResourceId(ressourceId: string): Promise<IComment[]> {
    return await CommentModel.find({ ressourceId })
      .populate("authorId", "firstname lastname")
      .sort("-date");
  }

  async findByUserId(authorId: string): Promise<IComment[]> {
    return await CommentModel.find({ authorId })
      .populate("authorId", "firstname lastname")
      .sort("-date");
  }

  async findAll(): Promise<IComment[]> {
    return await CommentModel.find().sort("-date");
  }

  async findById(id: string): Promise<IComment | null> {
    return await CommentModel.findById(id);
  }

  async create(data: Partial<IComment>): Promise<IComment> {
    return await CommentModel.create(data);
  }

  async deleteManyByResourceId(ressourceId: string): Promise<any> {
    return await CommentModel.deleteMany({ ressourceId });
  }

  async deleteManyByUserId(authorId: string): Promise<any> {
    return await CommentModel.deleteMany({ authorId });
  }

  async save(commentInstance: IComment): Promise<IComment> {
    return await commentInstance.save();
  }
}

export default new CommentRepository();
