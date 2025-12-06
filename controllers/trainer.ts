// trainer.ts (Corrected and working code)

import User from "../models/user.model";
import Trainer from "../models/trainer.model";
import s3 from "../utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getTrainerProfile = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).lean();
        const trainer = await Trainer.findOne({ userId }).lean();

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

        // Combine user data with nested trainer data for the frontend
        const profile = {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            profilePhoto: profilePhotoUrl, // ✅ force keep this
            zipCode: user.zipCode,
            email: user.email,

            // trainer-specific
            businessInfo: trainer?.businessInfo || { yearsOfExperience: 0, certifications: [] },
            services: trainer?.services || [],
            location: trainer?.location || { address: "", city: "", state: "" },
            portfolio: trainer?.portfolio || { bio: "", specializations: [] },
        };

        res.json(profile);
    } catch (err) {
        console.error("Error fetching trainer profile:", err);
        res.status(500).json({ error: "Server error while fetching profile" });
    }
};

export const updateTrainerProfile = async (req: any, res: any) => {
    try {
        const userId = req.user.id; // from authMiddleware

        const {
            firstName,
            lastName,
            phone,
            zipCode,
            yearsOfExperience,
            certifications,
            services,
            bio,
            specializations,
            location
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

        // ✅ Certifications (only "name")
        const formattedCertifications = (certifications || []).map((c: any) => ({
            name: c?.name || ""
        }));

        // ✅ Services
        const formattedServices = (services || []).map((s: any) => ({
            type: s?.type || "",
            description: s?.description || "",
            duration: s?.duration || 0,
            price: s?.price || 0
        }));

        // ✅ Specializations validation (max 3, must match a service type — case-insensitive)
        let validSpecializations: string[] = [];
        if (specializations && Array.isArray(specializations)) {
            const serviceTypes = formattedServices
                .map((s: any) => s?.type?.toLowerCase().trim())
                .filter(Boolean); // remove empty strings

            validSpecializations = specializations.filter((spec: string) =>
                serviceTypes.includes(spec?.toLowerCase().trim())
            );

            if (validSpecializations.length > 3) {
                validSpecializations = validSpecializations.slice(0, 3);
            }
        }

        // ✅ Location (default empty object if not provided)
        const formattedLocation = {
            address: location?.address || "",
            city: location?.city || "",
            state: location?.state || "",
        };

        // ✅ Update trainer profile
        const trainer = await Trainer.findOneAndUpdate(
            { userId },
            {
                "businessInfo.yearsOfExperience": yearsOfExperience || 0,
                "businessInfo.certifications": formattedCertifications,
                services: formattedServices,
                "portfolio.bio": bio || "",
                "portfolio.specializations": validSpecializations,
                location: formattedLocation
            },
            { new: true, upsert: true }
        );

        // ✅ Ensure response always has safe defaults
        res.json({
            message: "Trainer profile updated successfully",
            user,
            trainer: {
                ...trainer.toObject(),
                businessInfo: {
                    yearsOfExperience: trainer.businessInfo?.yearsOfExperience || 0,
                    certifications: trainer.businessInfo?.certifications || []
                },
                services: trainer.services || [],
                location: trainer.location || {
                    address: "",
                    city: "",
                    state: "",
                },
                portfolio: {
                    bio: trainer.portfolio?.bio || "",
                    specializations: trainer.portfolio?.specializations || []
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};