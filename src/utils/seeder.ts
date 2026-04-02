import * as dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import UserModel from "../models/User.js";
import CategorieModel from "../models/Categorie.js";
import TypeRelationModel from "../models/TypeRelation.js";
import RessourceModel from "../models/Ressource.js";
import CommentModel from "../models/Comment.js";
import InteractionModel from "../models/Interaction.js";
import { GlobalRole } from "../constants/roles.js";
import { GlobalTypeRessource } from "../constants/typeRessource.js";
import { RessourceInteractionType } from "../constants/interactions.js";

dotenv.config();

const seedDatabase = async (): Promise<void> => {
    try {
        await connectDB();

        // Start clean to keep the seed deterministic across runs.
        await Promise.all([
            InteractionModel.deleteMany({}),
            CommentModel.deleteMany({}),
            RessourceModel.deleteMany({}),
            TypeRelationModel.deleteMany({}),
            CategorieModel.deleteMany({}),
            UserModel.deleteMany({}),
        ]);

        const ids = {
            adminUser: new mongoose.Types.ObjectId(),
            standardUser: new mongoose.Types.ObjectId(),
            categoryCulture: new mongoose.Types.ObjectId(),
            categoryNature: new mongoose.Types.ObjectId(),
            relationFamily: new mongoose.Types.ObjectId(),
            relationFriends: new mongoose.Types.ObjectId(),
            resourceMuseum: new mongoose.Types.ObjectId(),
            resourceHike: new mongoose.Types.ObjectId(),
            commentMain: new mongoose.Types.ObjectId(),
            commentReply: new mongoose.Types.ObjectId(),
        };

        const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
        const userPasswordHash = await bcrypt.hash("User123!", 10);

        await UserModel.insertMany([
            {
                _id: ids.adminUser,
                firstname: "Admin",
                lastname: "ReSource",
                email: "admin@resource.local",
                password: adminPasswordHash,
                role: GlobalRole.ADMIN,
                systemStatus: "Enabled",
            },
            {
                _id: ids.standardUser,
                firstname: "Alice",
                lastname: "Martin",
                email: "alice@resource.local",
                password: userPasswordHash,
                role: GlobalRole.USER,
                systemStatus: "Enabled",
            },
        ] as any);

        await CategorieModel.insertMany([
            { _id: ids.categoryCulture, name: "Culture", systemStatus: "Enabled" },
            { _id: ids.categoryNature, name: "Nature", systemStatus: "Enabled" },
        ] as any);

        await TypeRelationModel.insertMany([
            {
                _id: ids.relationFamily,
                name: "Famille",
                description: "Activite adaptee en famille",
                systemStatus: "Enabled",
            },
            {
                _id: ids.relationFriends,
                name: "Amis",
                description: "Activite adaptee entre amis",
                systemStatus: "Enabled",
            },
        ] as any);

        await RessourceModel.insertMany([
            {
                _id: ids.resourceMuseum,
                userId: ids.adminUser,
                title: "Visite du musee municipal",
                description: "Parcours libre avec audioguide pour decouvrir la ville.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 42,
                path_media: "https://example.com/musee.jpg",
                categorie: ids.categoryCulture,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: true,
            },
            {
                _id: ids.resourceHike,
                userId: ids.standardUser,
                title: "Randonnee en foret",
                description: "Boucle de 8 km accessible et bien balisee.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 17,
                path_media: "https://example.com/rando.jpg",
                categorie: ids.categoryNature,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: false,
            },
        ] as any);

        await CommentModel.insertMany([
            {
                _id: ids.commentMain,
                content: "Super idee pour ce week-end !",
                authorId: ids.standardUser,
                ressourceId: ids.resourceMuseum,
            },
            {
                _id: ids.commentReply,
                content: "Merci, pense a reserver en avance.",
                authorId: ids.adminUser,
                ressourceId: ids.resourceMuseum,
                commentId: ids.commentMain,
            },
        ] as any);

        await InteractionModel.insertMany([
            {
                UserId: ids.standardUser,
                interactionType: RessourceInteractionType.VIEW,
                ressourceId: ids.resourceMuseum,
            },
            {
                UserId: ids.standardUser,
                interactionType: RessourceInteractionType.FAVORITE,
                ressourceId: ids.resourceMuseum,
                ReceiverId: ids.adminUser,
            },
            {
                UserId: ids.adminUser,
                interactionType: RessourceInteractionType.SHARE,
                ressourceId: ids.resourceHike,
                ReceiverId: ids.standardUser,
            },
        ] as any);

        console.log("Seed termine avec succes.");
        console.log("Comptes de test:");
        console.log("- admin@resource.local / Admin123!");
        console.log("- alice@resource.local / User123!");

        process.exit(0);
    } catch (error) {
        console.error("Erreur lors du seed:", error);
        process.exit(1);
    }
};

void seedDatabase();
