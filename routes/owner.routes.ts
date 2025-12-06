import express from "express";
import { authMiddleware } from "../middleware/auth";
import { getOwnerProfile, updateOwnerProfile, getAllTrainers, getTrainerById } from "../controllers/owner";
import { addDog, updateDog, deleteDog } from "../controllers/Pet";

const router = express.Router();

// Owner Profile
router.get("/profile", authMiddleware, getOwnerProfile);
router.put("/profile", authMiddleware, updateOwnerProfile);

// Pet Router
router.post("/dogs", authMiddleware, addDog);
router.put("/dogs/:dogId", authMiddleware, updateDog);
router.delete("/dogs/:dogId", authMiddleware, deleteDog)

// This route will be used by the dog owner to get a list of all trainers.
router.get("/trainers", authMiddleware, getAllTrainers);
router.get("/trainers/:trainerId", authMiddleware, getTrainerById )


export default router;