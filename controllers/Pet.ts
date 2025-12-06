import Owner from "../models/owner.model";
import mongoose from "mongoose";
import User from "../models/user.model"
import logger from "../utils/logger";

// Example Implementation for Adding a Dog
export const addDog = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const dogData = req.body;

        const owner = await Owner.findOne({ userId });
        if (!owner) {
            return res.status(404).json({ error: "Owner not found" });
        }

        owner.dogs.push(dogData);
        await owner.save();

        // Find the newly added dog to return it
        const newDog = owner.dogs[owner.dogs.length - 1];
        res.status(201).json({ message: "Dog added successfully", dog: newDog });
    } catch (err) {
        logger.error('Error adding dog', { userId: req.user.id, error: err });
        res.status(500).json({ error: "Server error" });
    }
};

// Example Implementation for Updating a Dog
export const updateDog = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const dogId = req.params.dogId;
        const updatedDogData = req.body;

        const owner = await Owner.findOne({ userId });
        if (!owner) {
            return res.status(404).json({ error: "Owner not found" });
        }

        // Cast the dogs array to a Mongoose DocumentArray to access the .id() method
        const dogsArray = owner.dogs as mongoose.Types.DocumentArray<any>;
        const dogToUpdate = dogsArray.id(dogId);

        if (!dogToUpdate) {
            return res.status(404).json({ error: "Dog not found" });
        }

        // Update the sub-document fields
        Object.assign(dogToUpdate, updatedDogData);
        await owner.save();

        res.json({ message: "Dog updated successfully", dog: dogToUpdate });
    } catch (err) {
        logger.error('Error updating dog', { userId: req.user.id, dogId: req.params.dogId, error: err });
        res.status(500).json({ error: "Server error" });
    }
};

// Example Implementation for Deleting a Dog
export const deleteDog = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const dogId = req.params.dogId;

        const owner = await Owner.findOne({ userId });
        if (!owner) {
            return res.status(404).json({ error: "Owner not found" });
        }

        // Cast the dogs array to a Mongoose DocumentArray to access the .pull() method.
        const dogsArray = owner.dogs as mongoose.Types.DocumentArray<any>;
        dogsArray.pull({ _id: new mongoose.Types.ObjectId(dogId) });

        await owner.save();

        res.json({ message: "Dog deleted successfully" });
    } catch (err) {
        logger.error('Error deleting dog', { userId: req.user.id, dogId: req.params.dogId, error: err });
        res.status(500).json({ error: "Server error" });
    }
};