import RessourceModel, { type IRessource } from "../models/Ressource.js";

class ResourceRepository {
  async findAll(query: object, sort: string): Promise<IRessource[]> {
    return await RessourceModel.find(query)
      .populate("userId", "firstname lastname")
      .populate("categorie typeRelation")
      .sort(sort);
  }

  async findPopular(limit: number): Promise<IRessource[]> {
    return await RessourceModel.find({ systemStatus: "Enabled" })
      .populate("userId", "firstname lastname")
      .populate("categorie typeRelation")
      .sort("-views")
      .limit(limit);
  }

  async findById(id: string): Promise<IRessource | null> {
    return await RessourceModel.findById(id)
      .populate("userId", "firstname lastname")
      .populate("categorie typeRelation");
  }

  async findByUserId(userId: string): Promise<IRessource[]> {
    return await RessourceModel.find({ userId })
      .populate("userId", "firstname lastname")
      .populate("categorie typeRelation")
      .sort("-createdAt");
  }

  async create(data: Partial<IRessource>): Promise<IRessource> {
    return await RessourceModel.create(data);
  }

  async update(
    id: string,
    data: Partial<IRessource>,
  ): Promise<IRessource | null> {
    return await RessourceModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async save(resource: IRessource): Promise<IRessource> {
    return await resource.save();
  }
}

export default new ResourceRepository();
