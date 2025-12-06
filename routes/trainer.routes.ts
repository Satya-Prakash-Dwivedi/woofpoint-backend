import express from "express"
import { authMiddleware } from "../middleware/auth"
import { getTrainerProfile, updateTrainerProfile } from "../controllers/trainer"

const router = express.Router()

router.get("/profile", authMiddleware, getTrainerProfile);
router.put("/profile", authMiddleware, updateTrainerProfile);

export default router;
