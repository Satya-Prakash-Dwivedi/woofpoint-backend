import mongoose, { Document, Schema } from 'mongoose';

export interface IDogTrainer extends Document {
    userId: mongoose.Types.ObjectId;
    businessInfo?: {
        yearsOfExperience: number;
        certifications: Array<{
            name?: string;
        }>;
    };
    services: Array<{
        type?: string;
        description?: string;
        duration?: number;
        price?: number;
    }>;
    location?: {
        address?: string;
        city?: string;
        state?: string;
    };
    ratings: {
        averageRating: number;
        totalReviews: number;
    };
    portfolio?: {
        bio?: string;
        specializations: string[];
    };
    isVerified: boolean;
    bookingHistory: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const DogTrainerSchema: Schema<IDogTrainer> = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    businessInfo: {
        yearsOfExperience: { type: Number, default: 0 },
        certifications: [{
            name: { type: String, default: "" },
        }]
    },
    services: [{
        type: { type: String, default: "" },
        description: { type: String, default: "" },
        duration: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
    }],
    location: {
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
    },
    ratings: {
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 }
    },
    portfolio: {
        bio: { type: String, default: "" },
        specializations: {
            type: [String],
            validate: {
                validator: function (arr: string[]) {
                    return arr.length <= 3; // enforce max 3 specializations
                },
                message: 'You can select up to 3 specializations only.'
            },
            default: []
        },
    },
    isVerified: { type: Boolean, default: false },
    bookingHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Booking'
    }]
}, {
    timestamps: true
});

export default mongoose.model<IDogTrainer>('DogTrainer', DogTrainerSchema);
