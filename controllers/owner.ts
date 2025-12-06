import Owner from "../models/owner.model";
import User from "../models/user.model";
import Trainer from "../models/trainer.model";
import s3 from "../utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mongoose from "mongoose";

/**
 * GET /owner/profile
 * Fetch combined user + dogOwner profile
 */
export const getOwnerProfile = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    const owner = await Owner.findOne({ userId }).lean();
    let profilePhotoUrl = "";
    if (user?.profilePhoto) {
      // extract S3 key from full URL
      const key = user.profilePhoto.split(".com/")[1];

      const command = new GetObjectCommand({
        Bucket: "woofpoint-private",
        Key: key,
      });

      // ✅ generate signed URL (valid for 1 hour)
      profilePhotoUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Combine user + owner profile
    const profile = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profilePhoto: profilePhotoUrl, // ✅ force keep this
      zipCode: user.zipCode,
      email: user.email,

      // owner specific profile
      location: owner?.location || { address: "", city: "", state: "", zipCode: "" },
      dogs: owner?.dogs || [],

    }

    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /owner/profile
 * Update owner profile details
 */
export const updateOwnerProfile = async (req: any, res: any) => {
  try {
    const userId = req.user.id; // from authMiddleware

    const {
      firstName,
      lastName,
      phone,
      zipCode,
      // profilePhoto,
      location,
      // dogs
    } = req.body;

    // ✅ Update User basic details
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phone, zipCode },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Location (default empty object if not provided)
    const ownerUpdateData: any = {};
    if (location) {
      ownerUpdateData.location = {
        address: location.address || "",
        city: location.city || "",
        state: location.state || "",
        zipCode: location.zipCode || ""
      };
    }


    // // ✅ Dogs (ensure array format + safe defaults)
    // const formattedDogs = (dogs || []).map((dog: any) => ({
    //   name: dog?.name || "",
    //   breed: dog?.breed || "",
    //   age: dog?.age || 0,
    //   size: dog?.size || "",
    //   photos: dog?.photos || ""
    // }));

    // ✅ Update or create Owner profile
    const owner = await Owner.findOneAndUpdate(
      { userId },
      ownerUpdateData,
      { new: true, upsert: true }
    );

    // ✅ Ensure response always has safe defaults
    res.json({
      message: "Owner profile updated successfully",
      user,
      owner: {
        ...owner.toObject(),
        location: owner.location || {
          address: "",
          city: "",
          state: "",
          zipCode: ""
        },
        dogs: owner.dogs
      }
    });
  } catch (err) {
    console.error("Update owner error:", err);
    res.status(500).json({ error: "Server error" });
  }
};    

/* Get all the trainer's profile to show to owners 
*/
export const getAllTrainers = async (req: any, res: any) => {
    try {
        // 1. Find all users who are trainers
        const trainerUsers = await User.find({ role: 'trainer' }).select('-password').lean();

        // 2. Get the userIds of these trainers
        const trainerUserIds = trainerUsers.map(user => user._id);

        // 3. Find all trainer profiles that match the userIds
        const trainerProfiles = await Trainer.find({ userId: { $in: trainerUserIds } }).lean();

        // 4. Create a map for easy lookup of trainer profiles
        const trainerProfileMap = new Map();
        trainerProfiles.forEach(profile => {
            trainerProfileMap.set(profile.userId.toString(), profile);
        });

        // 5. Combine user data with trainer profile data
        const trainers = trainerUsers.map(user => {
            const profile = trainerProfileMap.get(user._id.toString());
            return {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePhoto: user.profilePhoto || '', // Provide a default
                // Add any other relevant fields from the trainer's profile
                specializations: profile?.portfolio?.specializations || [],
                averageRating: profile?.ratings?.averageRating || 0,
                totalReviews: profile?.ratings?.totalReviews || 0,
                location: profile?.location || { city: "", state: "" },
            };
        });
        
        // 6. Respond with the combined list of trainers
        res.status(200).json(trainers);

    } catch (error) {
        console.error("Error fetching trainers:", error);
        res.status(500).json({ error: "Server error while fetching trainers" });
    }
};

/**
 * GET /owner/trainers/:trainerId
 * Fetches the complete profile for a single dog trainer.
 */
export const getTrainerById = async (req: any, res: any) => {
    try {
        const { trainerId } = req.params;
        console.log(`[Backend Debug] --- Received request for trainerId: ${trainerId}`);

        if (!mongoose.Types.ObjectId.isValid(trainerId)) {
            console.error(`[Backend Debug] --- Invalid Trainer ID format: ${trainerId}`);
            return res.status(400).json({ error: "Invalid Trainer ID" });
        }

        // 1. Find the user document
        console.log(`[Backend Debug] --- Searching for User with _id: ${trainerId}`);
        const user = await User.findById(trainerId).select('-password').lean();
        
        if (!user) {
            console.error(`[Backend Debug] --- User not found with _id: ${trainerId}`);
            return res.status(404).json({ error: "User record not found for this trainer." });
        }

        if (user.role !== 'trainer') {
            console.error(`[Backend Debug] --- User found, but their role is '${user.role}', not 'trainer'.`);
            return res.status(404).json({ error: "This user is not a trainer." });
        }

        console.log(`[Backend Debug] --- User found: ${user.firstName} ${user.lastName}. Now searching for their Trainer Profile.`);

        // 2. Find the corresponding trainer profile document
        const trainer = await Trainer.findOne({ userId: user._id }).lean();
        if (!trainer) {
            console.error(`[Backend Debug] --- CRITICAL: User record exists, but no Trainer profile was found for userId: ${user._id}`);
            return res.status(404).json({ error: "Trainer profile not found. The user may not have completed their profile setup." });
        }
        
        console.log(`[Backend Debug] --- Successfully found Trainer profile. Combining data...`);

        // 3. Combine all information into a single profile object
        const trainerProfile = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhoto: user.profilePhoto,
            email: user.email,
            phone: user.phone,
            location: trainer.location,
            bio: trainer.portfolio?.bio,
            yearsOfExperience: trainer.businessInfo?.yearsOfExperience,
            certifications: trainer.businessInfo?.certifications,
            services: trainer.services,
            specializations: trainer.portfolio?.specializations,
            averageRating: trainer.ratings?.averageRating,
            totalReviews: trainer.ratings?.totalReviews,
        };

        console.log(`[Backend Debug] --- Sending combined profile to frontend.`);
        res.status(200).json(trainerProfile);

    } catch (error) {
        console.error("[Backend Debug] --- An unexpected error occurred in getTrainerById:", error);
        res.status(500).json({ error: "Server error while fetching trainer details" });
    }
};

