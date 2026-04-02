import UserModel, { type IUser } from "../models/User.js";

class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    return await UserModel.create(data);
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return await UserModel.findOne({ email }).select("+password");
  }

  async findById(id: string): Promise<IUser | null> {
    return await UserModel.findById(id);
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return await UserModel.findById(id).select("+password");
  }

  async findAll(): Promise<IUser[]> {
    return await UserModel.find().sort("-createdAt");
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return await UserModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: string): Promise<IUser | null> {
    return await UserModel.findByIdAndDelete(id);
  }

  async save(user: IUser): Promise<IUser> {
    return await user.save();
  }
}

export default new UserRepository();
