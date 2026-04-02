import type { Request, Response } from "express";
import UserRepository from "../repositories/userRepository.js";

/**
 * @desc    Récupérer mon profil (Utilisateur connecté)
 * @route   GET /api/users/me
 */
export const getMe = async (req: any, res: Response) => {
  try {
    res.status(200).json({
      status: "success",
      data: { user: req.user },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Modifier mon profil (Utilisateur connecté)
 * @route   PATCH /api/users/updateMe
 */
export const updateMe = async (req: any, res: Response) => {
  try {
    const { firstname, lastname, email, birthdate } = req.body;

    const updatedUser = await UserRepository.update(req.user._id, {
      firstname,
      lastname,
      email,
      birthdate,
    });

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Modifier mon mot de passe (Utilisateur connecté)
 * @route   PATCH /api/users/updateMyPassword
 */
export const updateMyPassword = async (req: any, res: Response) => {
  try {
    const { passwordCurrent, password, passwordConfirm } = req.body;

    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: "error",
        message: "Les mots de passe ne correspondent pas.",
      });
    }

    const user = await UserRepository.findByIdWithPassword(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "Utilisateur non trouvé." });
    }

    const isMatch = await user.comparePassword(passwordCurrent);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "error", message: "Mot de passe actuel incorrect." });
    }

    user.password = password;
    await UserRepository.save(user);

    res.status(200).json({
      status: "success",
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Récupérer tous les utilisateurs (Admin uniquement)
 * @route   GET /api/users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserRepository.findAll();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Gérer un compte : changer rôle ou statut (Admin uniquement)
 * @route   PATCH /api/users/:id
 */
export const updateUser = async (req: any, res: Response) => {
  try {
    const user = await UserRepository.update(req.params.id as string, req.body);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({ status: "success", data: { user } });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Désactivation administrative d'un compte (Admin uniquement)
 * @route   DELETE /api/users/:id
 */
export const deleteUser = async (req: any, res: Response) => {
  try {
    const user = await UserRepository.update(req.params.id as string, {
      systemStatus: "Disabled",
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({
      status: "success",
      message: "Le compte a été désactivé avec succès",
      data: { user },
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc   Réactivation administrative d'un compte (Admin uniquement)
 * @route  PATCH /api/users/:id/reactivate
 */
export const reactivateUser = async (req: any, res: Response) => {
  try {
    const user = await UserRepository.update(req.params.id as string, {
      systemStatus: "Enabled",
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({
      status: "success",
      message: "Le compte a été réactivé avec succès",
      data: { user },
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * @desc    Suppression de mon propre compte
 */
export const deleteMe = async (req: any, res: Response) => {
  try {
    await UserRepository.deleteById(req.user._id);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
