import type { Response } from 'express';
import DiagnosticTest from '../models/DiagnosticTest.js';
import DiagnosticQuestion from '../models/DiagnosticQuestion.js';
import DiagnosticResult from '../models/DiagnosticResult.js';

// --- PARTIE PUBLIQUE (Mobile) ---

// 1. Lister tous les tests disponibles
export const getActiveTests = async (req: any, res: Response) => {
    try {
        const tests = await DiagnosticTest.find({ isActive: true });
        res.status(200).json({ status: 'success', data: { tests } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 2. Récupérer les questions d'un test spécifique
export const getTestQuestions = async (req: any, res: Response) => {
    try {
        const { testId } = req.params;
        const questions = await DiagnosticQuestion.find({ test: testId, isActive: true }).sort({ order: 1 });
        res.status(200).json({ status: 'success', data: { questions } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// --- PARTIE UTILISATEUR CONNECTÉ (Mobile) ---

// 3. Sauvegarder le résultat pour un test précis
export const saveTestResult = async (req: any, res: Response) => {
    try {
        const { testId } = req.params;
        const { score } = req.body;

        if (score === undefined) return res.status(400).json({ message: "Le score est obligatoire." });

        const newResult = await DiagnosticResult.create({
            user: req.user._id,
            test: testId,
            score: score
        });
        res.status(201).json({ status: 'success', data: { result: newResult } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// 4. Historique de l'utilisateur avec le nom des tests
export const getMyResults = async (req: any, res: Response) => {
    try {
        const results = await DiagnosticResult.find({ user: req.user._id })
            .populate('test', 'title') // On ramène le titre du test pour l'affichage
            .sort('-createdAt');

        res.status(200).json({ status: 'success', data: { results } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==========================================
// GESTION DES TESTS (BACK-OFFICE)
// ==========================================

/** @desc Récupérer tous les tests pour l'admin */
export const getAllTestsAdmin = async (req: any, res: Response) => {
    try {
        const tests = await DiagnosticTest.find().sort('-createdAt');
        res.status(200).json({ status: 'success', data: { tests } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** @desc Créer un nouveau type de test (ex: Stress, Sommeil) */
export const createTest = async (req: any, res: Response) => {
    try {
        const { title, description, rules } = req.body;
        const newTest = await DiagnosticTest.create({ title, description, rules });
        res.status(201).json({ status: 'success', data: { test: newTest } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/** @desc Modifier un test et ses règles de score */
export const updateTest = async (req: any, res: Response) => {
    try {
        const updatedTest = await DiagnosticTest.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!updatedTest) return res.status(404).json({ message: "Test introuvable" });
        res.status(200).json({ status: 'success', data: { test: updatedTest } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/** @desc Activer/Désactiver un test */
export const toggleTestStatus = async (req: any, res: Response) => {
    try {
        const test = await DiagnosticTest.findById(req.params.id);
        if (!test) return res.status(404).json({ message: "Test introuvable" });
        test.isActive = !test.isActive;
        await test.save();
        res.status(200).json({ status: 'success', data: { test } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// ==========================================
// GESTION DES QUESTIONS PAR TEST (BACK-OFFICE)
// ==========================================

/** @desc Récupérer toutes les questions d'un test spécifique (admin) */
export const getQuestionsForTestAdmin = async (req: any, res: Response) => {
    try {
        const questions = await DiagnosticQuestion.find({ test: req.params.testId }).sort('order');
        res.status(200).json({ status: 'success', data: { questions } });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** @desc Ajouter une question à un test précis */
export const createQuestionForTest = async (req: any, res: Response) => {
    try {
        const { text, order, answers } = req.body;
        const newQuestion = await DiagnosticQuestion.create({
            test: req.params.testId,
            text,
            order,
            answers
        });
        res.status(201).json({ status: 'success', data: { question: newQuestion } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/** @desc Modifier une question (indépendant du test) */
export const updateQuestion = async (req: any, res: Response) => {
    try {
        const updated = await DiagnosticQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ status: 'success', data: { question: updated } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/** @desc Supprimer ou désactiver une question */
export const toggleQuestionStatus = async (req: any, res: Response) => {
    try {
        const question = await DiagnosticQuestion.findById(req.params.id);
        if (!question) return res.status(404).json({ message: "Question introuvable" });
        question.isActive = !question.isActive;
        await question.save();
        res.status(200).json({ status: 'success', data: { question } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};