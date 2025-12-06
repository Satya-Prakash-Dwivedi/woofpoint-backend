import express from "express"
import multer from "multer";
import { signup, login, logout } from "../controllers/user"
import { authMiddleware } from "../middleware/auth";
import { uploadPhoto } from "../controllers/user";

const router = express.Router()

// Configure multer with better error handling
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed') as any, false);
        }
    },
});

// Handle multer errors
const handleUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    upload.single("profilePhoto")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
            }
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout)
router.post("/upload-photo", authMiddleware, handleUpload, uploadPhoto);

export default router;