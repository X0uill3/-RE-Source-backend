import multer from 'multer';
import path from 'path';
import fs from 'fs';

// S'assurer que le dossier existe
const uploadDir = 'uploads/resources';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // On crée un nom unique pour éviter d'écraser des fichiers
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resource-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ storage: storage });