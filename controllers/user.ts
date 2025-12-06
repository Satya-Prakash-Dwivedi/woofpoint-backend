import bcrypt from "bcrypt"
import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken"
import User from "../models/user.model";
import s3 from "../utils/s3";
import DogOwner from "../models/owner.model";
import DogTrainer from "../models/trainer.model";
import logger from "../utils/logger"


require('dotenv').config();

interface AuthRequest extends Request {
    user?: { id: string; role?: string };
}

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, role, firstName, lastName, phone, zipCode } = req.body;

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn('Signup attempt for existing user', { email });
            return res.status(400).json({ error: "User already exists" });
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create new user
        const user = new User({
            email,
            password: hashedPassword,
            role,
            firstName,
            lastName,
            phone,
            zipCode,
        });

        logger.info('New user created', { userId: user._id, email: user.email, role: user.role });

        await user.save();

        // create role-specific profile
        if (user.role === "owner") {
            await DogOwner.create({ userId: user._id });
        } else if (user.role === "trainer") {
            await DogTrainer.create({ userId: user._id });
        }

        // sign jwt token - FIXED: Make consistent with login
        const token = jwt.sign(
            {
                _id: user._id,      // Changed from 'id' to '_id' to match login
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return res.status(201).json({ token });
    } catch (err) {
        logger.error('Signup error', { error: err });
        res.status(500).json({ error: "Server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        // Clean and normalize email
        const cleanEmail = email.toLowerCase().trim();

        // Find user by email
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            logger.warn('Login attempt with non-existent email', { email: cleanEmail });
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Clean password (remove any whitespace)
        const cleanPassword = password.trim();


        // Compare password
        const isPasswordValid = await bcrypt.compare(cleanPassword, user.password);

        if (!isPasswordValid) {
            logger.warn('Login attempt with invalid password', { email: cleanEmail });
            return res.status(401).json({  
                error: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                _id: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        // Don't send password in response
        const userResponse = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        logger.info('User logged in successfully', {userId : user._id, email : user.email})

        res.status(200).json({
            user: userResponse,
            token,
            message: "Login successful",
            role: user.role
        });


    } catch (error: any) {
        logger.error('Login error', {error: error});

        res.status(500).json({
            error: "Login failed",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const logout = async (req: AuthRequest, res: Response) => {
    try {
        // In a stateless JWT system, we can't invalidate tokens on the server side
        // The logout is handled on the client side by removing the token
        // But we can log the logout event for security/audit purposes

        const userId = req.user?.id;
        const userEmail = req.user ? await User.findById(userId, 'email') : null;

        logger.info('User logged out', { userId: userId, email: userEmail?.email || 'Unknown' });

        res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (error: any) {
        logger.error('Logout error', { userId: req.user?.id, error: error });
        res.status(500).json({
            error: "Logout failed",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


export const uploadPhoto = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.user?.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { mimetype, originalname, buffer } = req.file;
        const key = `profile-photos/${req.user.id}-${Date.now()}-${originalname || "photo.jpg"}`;

        // Upload file to S3 with the file buffer
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Body: buffer, // This was missing in your original code!
            ContentType: mimetype,
            // ACL: "public-read", // Uncomment if you want public access
        });

        await s3.send(command);

        // Construct the public URL
        const photoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Update user profilePhoto in MongoDB
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePhoto: photoUrl },
            { new: true, projection: "-password" }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            message: "Profile photo uploaded successfully",
            photoUrl,
            user,
        });
    } catch (err) {
        logger.error('Upload photo error', { userId: req.user?.id, error: err });
        return res.status(500).json({
            error: "Server error",
            details: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
        });
    }
};
