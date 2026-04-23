import InteractionModel, { type IInteraction } from "../models/Interaction.js";
import mongoose from "mongoose";
import { RessourceInteractionType } from '../constants/interactions.js'

class InteractionRepository {
  /**
   * Créer une nouvelle interaction
   */
  async create(data: Partial<IInteraction>): Promise<IInteraction> {
    return await InteractionModel.create(data);
  }

  /**
   * Récupérer les interactions d'un utilisateur
   */
  async findByUserId(
    userId: string | mongoose.Types.ObjectId,
  ): Promise<IInteraction[]> {
    return await InteractionModel.find({ UserId: userId }).sort("-date");
  }

  /**
   * Récupérer les interactions d'une ressource
   */
  async findByResourceId(
    ressourceId: string | mongoose.Types.ObjectId,
  ): Promise<IInteraction[]> {
    return await InteractionModel.find({ ressourceId }).sort("-date");
  }

  /**
   * Supprimer une interaction spécifique appartenant à l'utilisateur
   */
  async deleteUserInteraction(
    id: string,
    userId: string | mongoose.Types.ObjectId,
  ): Promise<IInteraction | null> {
    return await InteractionModel.findOneAndDelete({
      _id: id,
      UserId: userId,
    });
  }

  async getSavedResources(userId: string | mongoose.Types.ObjectId): Promise<IInteraction[]> {
    return await InteractionModel.find({
      UserId: userId,
      interactionType: RessourceInteractionType.SAVE
    }).sort("-date");
  }

  async getFavoriteResources(userId: string | mongoose.Types.ObjectId): Promise<IInteraction[]> {
    return await InteractionModel.find({
      UserId: userId,
      interactionType: RessourceInteractionType.FAVORITE
    }).sort("-date");
  }


}

export default new InteractionRepository();
