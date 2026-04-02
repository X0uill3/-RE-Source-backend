import TypeRelationModel, {
  type ITypeRelation,
} from "../models/TypeRelation.js";

class TypeRelationRepository {
  async findAll(filter: object = {}): Promise<ITypeRelation[]> {
    return await TypeRelationModel.find(filter).sort("-createdAt");
  }

  async findById(id: string): Promise<ITypeRelation | null> {
    return await TypeRelationModel.findById(id);
  }

  async findOneAndUpdateByStatus(
    id: string,
    currentStatus: string,
    updateData: Partial<ITypeRelation>,
  ): Promise<ITypeRelation | null> {
    return await TypeRelationModel.findOneAndUpdate(
      { _id: id, systemStatus: currentStatus },
      { ...updateData, updatedAt: new Date() },
      { new: true },
    );
  }

  async create(data: Partial<ITypeRelation>): Promise<ITypeRelation> {
    return await TypeRelationModel.create(data);
  }
}

export default new TypeRelationRepository();
