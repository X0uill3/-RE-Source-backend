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
            resourceStopSmoking: new mongoose.Types.ObjectId(),
            resourceMorningRun: new mongoose.Types.ObjectId(),
            resourceDetoxSmoothie: new mongoose.Types.ObjectId(),
            resourceBurnoutPrevention: new mongoose.Types.ObjectId(),
            resourceBookClub: new mongoose.Types.ObjectId(),
            resourceOilPainting: new mongoose.Types.ObjectId(),
            resourceOperaVisit: new mongoose.Types.ObjectId(),
            resourceBackHealth: new mongoose.Types.ObjectId(),
            resourceVeganCooking: new mongoose.Types.ObjectId(),
            resourceNaturePhotography: new mongoose.Types.ObjectId(),

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
                _id: ids.resourceStopSmoking,
                userId: ids.adminUser,
                title: "Arrêter de fumer : Guide pratique",
                description: "Les premières étapes pour une vie sans tabac.",
                content: "Ce guide détaille les bénéfices immédiats de l'arrêt du tabac : retour du goût, meilleure capacité respiratoire et économies financières. Il propose des méthodes de substitution et des exercices de respiration pour gérer les envies soudaines.",
                picture: "https://picsum.photos/seed/health/800/600",
                path_media: "https://example.com/guides/stop-smoking.pdf",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 1250,
                categorie: ids.categoryPrevention,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: true,
            },
            {
                _id: ids.resourceMorningRun,
                userId: ids.standardUser,
                title: "Course à pied : Débuter en douceur",
                description: "Programme de 4 semaines pour courir ses premiers 5km.",
                content: "L'objectif est d'alterner marche et course pour habituer le cœur et les articulations. Semaine 1 : 1 min de course, 2 min de marche pendant 20 min. Hydratez-vous bien avant et après chaque séance.",
                picture: "https://picsum.photos/seed/running/800/600",
                path_media: "https://example.com/audio/running-coach.mp3",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 840,
                categorie: ids.categoryExercice,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: false,
            },
            {
                _id: ids.resourceDetoxSmoothie,
                userId: ids.adminUser,
                title: "Recettes de Smoothies Verts",
                description: "Faites le plein de vitamines avec des ingrédients naturels.",
                content: "Mélangez une poignée d'épinards frais, une pomme verte, un demi-concombre et un filet de jus de citron. Ce breuvage est riche en antioxydants et idéal pour purifier votre système digestif le matin.",
                picture: "https://picsum.photos/seed/smoothie/800/600",
                path_media: "https://example.com/videos/smoothie-prep.mp4",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 230,
                categorie: ids.categoryNutrition,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: true,
            },
            {
                _id: ids.resourceBurnoutPrevention,
                userId: ids.adminUser,
                title: "Prévenir l'épuisement professionnel",
                description: "Reconnaître les signes avant-coureurs du burn-out.",
                content: "Le burn-out ne prévient pas. Apprenez à identifier la fatigue chronique, le cynisme vis-à-vis du travail et la baisse d'efficacité. Apprenez à poser des limites claires entre vie pro et vie perso dès aujourd'hui.",
                picture: "https://picsum.photos/seed/stress/800/600",
                path_media: "https://example.com/articles/burnout-guide.html",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 3100,
                categorie: ids.categorySanteMentale,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: true,
            },
            {
                _id: ids.resourceBookClub,
                userId: ids.standardUser,
                title: "Cercle de lecture mensuel",
                description: "Partagez vos coups de cœur littéraires avec la communauté.",
                content: "Nous nous réunissons chaque premier mardi du mois pour discuter d'un ouvrage sélectionné ensemble. Un moment de convivialité pour découvrir de nouveaux auteurs et échanger des points de vue enrichissants.",
                picture: "https://picsum.photos/seed/books/800/600",
                path_media: "https://example.com/events/calendar-july.ics",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 156,
                categorie: ids.categorySocial,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: false,
            },
            {
                _id: ids.resourceOilPainting,
                userId: ids.standardUser,
                title: "Initiation à la peinture à l'huile",
                description: "Apprenez les bases de la couleur et du mélange des pigments.",
                content: "Ce cours aborde la technique du 'gras sur maigre'. Apprenez à préparer votre toile, à esquisser vos formes au fusain puis à superposer les couches de peinture pour créer de la profondeur et de la lumière.",
                picture: "https://picsum.photos/seed/painting/800/600",
                path_media: "https://example.com/tutorials/oil-painting-01.mp4",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 420,
                categorie: ids.categoryLoisir,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: false,
            },
            {
                _id: ids.resourceOperaVisit,
                userId: ids.adminUser,
                title: "Visite des coulisses de l'Opéra",
                description: "Découvrez l'envers du décor d'un monument historique.",
                content: "De la machinerie complexe sous la scène aux ateliers de couture où sont confectionnés les costumes, plongez dans l'histoire de cet édifice prestigieux et du savoir-faire des artisans du spectacle.",
                picture: "https://picsum.photos/seed/opera/800/600",
                path_media: "https://example.com/maps/opera-tour.pdf",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 670,
                categorie: ids.categoryCulture,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: true,
            },
            {
                _id: ids.resourceBackHealth,
                userId: ids.adminUser,
                title: "Ergonomie au poste de travail",
                description: "Comment bien régler son siège et son écran pour éviter le mal de dos.",
                content: "Vos yeux doivent être à hauteur du haut de l'écran. Vos pieds doivent reposer à plat sur le sol ou sur un repose-pied. Pensez à vous lever et à vous étirer toutes les 45 minutes pour relancer la circulation.",
                picture: "https://picsum.photos/seed/office/800/600",
                path_media: "https://example.com/posters/ergonomie.png",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 2800,
                categorie: ids.categoryPrevention,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: true,
            },
            {
                _id: ids.resourceVeganCooking,
                userId: ids.standardUser,
                title: "Cuisine Végétalienne Gourmande",
                description: "Cuisiner sans produits d'origine animale tout en se faisant plaisir.",
                content: "Découvrez comment remplacer les œufs par des graines de lin ou du tofu soyeux. Cette ressource propose une recette de burger de pois chiches et une mousse au chocolat à base d'aquafaba (jus de cuisson des pois chiches).",
                picture: "https://picsum.photos/seed/food/800/600",
                path_media: "https://example.com/recipes/vegan-delights.pdf",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 540,
                categorie: ids.categoryNutrition,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFamily,
                start: false,
            },
            {
                _id: ids.resourceNaturePhotography,
                userId: ids.standardUser,
                title: "Sortie Photo : Macrophotographie",
                description: "Capturer la beauté de l'infiniment petit en forêt.",
                content: "Munissez-vous d'un objectif macro ou de bagues d'allonge. Nous apprendrons à gérer la très faible profondeur de champ pour isoler un insecte ou le détail d'une fleur sur un fond flou artistique (le bokeh).",
                picture: "https://picsum.photos/seed/nature/800/600",
                path_media: "https://example.com/galleries/macro-forest.jpg",
                systemStatus: "Enabled",
                visibility: "Public",
                views: 310,
                categorie: ids.categoryLoisir,
                typeRessource: GlobalTypeRessource.ACTIVITY,
                typeRelation: ids.relationFriends,
                start: false,
            }
        ] as any);

        await CommentModel.insertMany([
            {
                _id: ids.commentMain,
                content: "Super idee pour ce week-end !",
                authorId: ids.standardUser,
                ressourceId: ids.resourceNaturePhotography,
            },
            {
                _id: ids.commentReply,
                content: "Merci, pense a reserver en avance.",
                authorId: ids.adminUser,
                ressourceId: ids.resourceNaturePhotography,
                commentId: ids.commentMain,
            },
        ] as any);

        await InteractionModel.insertMany([
            {
                UserId: ids.standardUser,
                interactionType: RessourceInteractionType.VIEW,
                ressourceId: ids.resourceNaturePhotography,
            },
            {
                UserId: ids.standardUser,
                interactionType: RessourceInteractionType.FAVORITE,
                ressourceId: ids.resourceNaturePhotography,
                ReceiverId: ids.adminUser,
            },
            {
                UserId: ids.adminUser,
                interactionType: RessourceInteractionType.SHARE,
                ressourceId: ids.resourceNaturePhotography,
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
