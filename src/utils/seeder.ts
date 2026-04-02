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
            categoryPrevention: new mongoose.Types.ObjectId(),
            categoryExercice: new mongoose.Types.ObjectId(),
            categoryNutrition: new mongoose.Types.ObjectId(),
            categorySanteMentale: new mongoose.Types.ObjectId(),
            categorySocial: new mongoose.Types.ObjectId(),
            categoryLoisir: new mongoose.Types.ObjectId(),
            categoryCulture: new mongoose.Types.ObjectId(),
            relationFamily: new mongoose.Types.ObjectId(),
            relationFriends: new mongoose.Types.ObjectId(),
            commentMain: new mongoose.Types.ObjectId(),
            commentReply: new mongoose.Types.ObjectId(),
            resourceYoga: new mongoose.Types.ObjectId(),
            resourceCooking: new mongoose.Types.ObjectId(),
            resourceMeditation: new mongoose.Types.ObjectId(),
            resourceNeighborParty: new mongoose.Types.ObjectId(),
            resourcePhotoWorkshop: new mongoose.Types.ObjectId(),
            resourceTheater: new mongoose.Types.ObjectId(),
            resourceFirstAid: new mongoose.Types.ObjectId(),
            resourceSmoothieRecipes: new mongoose.Types.ObjectId(),
            resourceBoardGames: new mongoose.Types.ObjectId(),
            resourceSelfEsteem: new mongoose.Types.ObjectId(),
            resourceGardenVolunteering: new mongoose.Types.ObjectId(),
        };

        const adminPasswordHash = await bcrypt.hash("password123", 10);
        const userPasswordHash = await bcrypt.hash("password123", 10);

        await UserModel.insertMany([
            {
                _id: ids.adminUser,
                firstname: "Admin",
                lastname: "ReSource",
                email: "admin@test.fr",
                password: adminPasswordHash,
                role: GlobalRole.ADMIN,
                systemStatus: "Enabled",
            },
            {
                _id: ids.standardUser,
                firstname: "Alice",
                lastname: "Martin",
                email: "alice@test.fr",
                password: userPasswordHash,
                role: GlobalRole.USER,
                systemStatus: "Enabled",
            },
        ] as any);

        await CategorieModel.insertMany([
            { _id: ids.categoryPrevention, name: "Prevention", icon: "shield-alt", systemStatus: "Enabled" },
            { _id: ids.categoryExercice, name: "Exercice", icon: "dumbbell", systemStatus: "Enabled" },
            { _id: ids.categoryNutrition, name: "Nutrition", icon: "apple-alt", systemStatus: "Enabled" },
            { _id: ids.categorySanteMentale, name: "Sante Mentale", icon: "brain", systemStatus: "Enabled" },
            { _id: ids.categorySocial, name: "Social", icon: "users", systemStatus: "Enabled" },
            { _id: ids.categoryLoisir, name: "Loisir", icon: "smile", systemStatus: "Enabled" },
            { _id: ids.categoryCulture, name: "Culture", icon: "theater-masks", systemStatus: "Enabled" },
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
            {
                _id: new mongoose.Types.ObjectId(),
                name: "Couple",
                description: "Activite adaptee pour les couples",
                systemStatus: "Enabled",
            },
            {
                _id: new mongoose.Types.ObjectId(),
                name: "Collègues",
                description: "Activite adaptee pour les collègues de travail",
                systemStatus: "Enabled",
            },
            {
                _id: new mongoose.Types.ObjectId(),
                name: "Parents",
                description: "Activite adaptee pour les parents avec enfants",
                systemStatus: "Enabled",
            },
        ] as any);

        await RessourceModel.insertMany([
            {
                _id: ids.resourceYoga,
                userId: ids.adminUser,
                title: "Séance de Yoga matinale",
                description: "Un cours de 30 minutes pour réveiller le corps et l'esprit en douceur.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 124,
                path_media: "https://example.com/yoga.jpg",
                categorie: ids.categoryExercice,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: true,
            },
            {
                _id: ids.resourceCooking,
                userId: ids.standardUser,
                title: "Atelier Cuisine : Équilibre et Saveurs",
                description: "Apprenez à cuisiner des plats sains avec des produits de saison.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 89,
                path_media: "https://example.com/cuisine.jpg",
                categorie: ids.categoryNutrition,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: false,
            },
            {
                _id: ids.resourceMeditation,
                userId: ids.adminUser,
                title: "Introduction à la Méditation",
                description: "Exercices simples de respiration pour réduire le stress quotidien.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 210,
                path_media: "https://example.com/meditation.jpg",
                categorie: ids.categorySanteMentale,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends, // Convient aussi en solo/amis
                start: true,
            },
            {
                _id: ids.resourceNeighborParty,
                userId: ids.standardUser,
                title: "Fête de quartier - Rencontre citoyenne",
                description: "Moment de partage et d'échange pour renforcer les liens locaux.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 56,
                path_media: "https://example.com/social.jpg",
                categorie: ids.categorySocial,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: false,
            },
            {
                _id: ids.resourcePhotoWorkshop,
                userId: ids.standardUser,
                title: "Initiation à la Photographie",
                description: "Sortie urbaine pour apprendre les bases de la composition photo.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 34,
                path_media: "https://example.com/photo.jpg",
                categorie: ids.categoryLoisir,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: false,
            },
            {
                _id: ids.resourceTheater,
                userId: ids.adminUser,
                title: "Pièce de Théâtre : L'Avare",
                description: "Représentation classique pour toute la famille au théâtre municipal.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 152,
                path_media: "https://example.com/theatre.jpg",
                categorie: ids.categoryCulture,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: true,
            },
            {
                _id: ids.resourceFirstAid,
                userId: ids.adminUser,
                title: "Formation aux premiers secours",
                description: "Apprenez les gestes qui sauvent avec des professionnels.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 301,
                path_media: "https://example.com/secours.jpg",
                categorie: ids.categoryPrevention,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: true,
            },
            {
                _id: ids.resourceSmoothieRecipes,
                userId: ids.standardUser,
                title: "Recettes de Smoothies Vitaminés",
                description: "Guide pratique pour faire le plein d'énergie dès le matin.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 75,
                path_media: "https://example.com/smoothie.jpg",
                categorie: ids.categoryNutrition,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: false,
            },
            {
                _id: ids.resourceBoardGames,
                userId: ids.standardUser,
                title: "Soirée Jeux de Société",
                description: "Découverte de nouveaux jeux de stratégie et de plateau.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 43,
                path_media: "https://example.com/jeux.jpg",
                categorie: ids.categoryLoisir,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: false,
            },
            {
                _id: ids.resourceSelfEsteem,
                userId: ids.adminUser,
                title: "Conférence : Confiance en soi",
                description: "Clés et conseils pour mieux s'affirmer au travail et en famille.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 188,
                path_media: "https://example.com/confiance.jpg",
                categorie: ids.categorySanteMentale,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: true,
            },
            {
                _id: ids.resourceGardenVolunteering,
                userId: ids.standardUser,
                title: "Bénévolat : Jardin Partagé",
                description: "Venez aider à l'entretien du potager communautaire.",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 29,
                path_media: "https://example.com/jardin.jpg",
                categorie: ids.categorySocial,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: false,
            }
        ] as any);

        await CommentModel.insertMany([
            {
                _id: ids.commentMain,
                content: "Super idee pour ce week-end !",
                authorId: ids.standardUser,
                ressourceId: ids.resourceYoga,
            },
            {
                _id: ids.commentReply,
                content: "Merci, pense a reserver en avance.",
                authorId: ids.adminUser,
                ressourceId: ids.resourceYoga,
                commentId: ids.commentMain,
            },
        ] as any);

        await InteractionModel.insertMany([
            {
                UserId: ids.standardUser,
                interactionType: RessourceInteractionType.VIEW,
                ressourceId: ids.resourceYoga,
            },
            {
                UserId: ids.standardUser,
                interactionType: RessourceInteractionType.FAVORITE,
                ressourceId: ids.resourceYoga,
                ReceiverId: ids.adminUser,
            },
            {
                UserId: ids.adminUser,
                interactionType: RessourceInteractionType.SHARE,
                ressourceId: ids.resourceYoga,
                ReceiverId: ids.standardUser,
            },
        ] as any);

        console.log("Seed termine avec succes.");
        console.log("Comptes de test:");
        console.log("- admin@test.fr / password123");
        console.log("- alice@test.fr / password123");

        process.exit(0);
    } catch (error) {
        console.error("Erreur lors du seed:", error);
        process.exit(1);
    }
};

void seedDatabase();
