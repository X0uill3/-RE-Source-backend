import CategorieModel, { type ICategorie } from "../models/Categorie.js";

class CategorieRepository {
  async findAll(filter: object = {}): Promise<ICategorie[]> {
    return await CategorieModel.find(filter).sort("name");
  }

  async findByIdAndStatus(
    id: string,
    status?: string,
  ): Promise<ICategorie | null> {
    const query = CategorieModel.findById(id);
    if (status) query.where("systemStatus").equals(status);
    return await query;
  }

  async create(name: string): Promise<ICategorie> {
    return await CategorieModel.create({ name });
  }

  async update(
    id: string,
    data: Partial<ICategorie>,
  ): Promise<ICategorie | null> {
    return await CategorieModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async save(categorie: ICategorie): Promise<ICategorie> {
    return await categorie.save();
  }
}

export default new CategorieRepository();
