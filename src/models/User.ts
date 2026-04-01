import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { GlobalRole } from '../constants/roles.js'; // On déplace l'enum ici

export interface IUser extends Document {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    birthdate?: Date;
    role: GlobalRole;
    picture?: string;
    systemStatus: 'Enabled' | 'Disabled'; // Pour la désactivation par l'Admin
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>({
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { type: String, required: true, select: false },
    birthdate: { type: Date },
    picture: { type: String, default: '' },
    role: {
        type: String,
        enum: Object.values(GlobalRole),
        default: GlobalRole.USER
    },
    systemStatus: {
        type: String,
        enum: ['Enabled', 'Disabled'],
        default: 'Enabled'
    },
}, { timestamps: true });

// Hashage automatique du mot de passe (Sécurité et RGPD) 
UserSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return;
});

// Méthode de comparaison pour le Login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const UserModel: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default UserModel;