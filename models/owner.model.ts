import mongoose, { Document, Schema } from 'mongoose';

export interface IDogOwner extends Document {
    userId: mongoose.Types.ObjectId;
    location?: {
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    dogs: Array<{
        name?: string;
        breed?: string;
        age?: number;
        size?: 'small' | 'medium' | 'large';
        photos?: string[];
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const DogOwnerSchema: Schema<IDogOwner> = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    location: {
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        zipCode: { type: String, default: "" },
    },
    dogs: [{
        name: { type: String, default: "" },
        breed: { type: String, default: "" },
        age: { type: Number, default: 0 },
        size: { type: String, enum: ['small', 'medium', 'large'], default: 'small' },
        photos: [{ type: String }]
    }],
}, {
    timestamps: true
});

export default mongoose.model<IDogOwner>('DogOwner', DogOwnerSchema);
