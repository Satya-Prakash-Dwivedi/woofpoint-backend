import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    _id: string;
    email: string;
    password: string;
    role: 'owner' | 'trainer';
    firstName: string;
    lastName: string;
    phone: string,
    zipCode: string,
    profilePhoto?: string,
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['owner', 'trainer'],
        required: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: /^[0-9]{10}$/, // Regex for phone numbers
    },
    zipCode: {
        type: String,
        required: true,
        trim: true,
        match: /^[0-9]{5,6}$/, // Regex for US zip code
    },
    profilePhoto: {
        type: String,
        // trim: true,
        default: '',
    }
}, {
    timestamps: true
})

// Search Indexes for query

UserSchema.index({ role: 1 });
UserSchema.index({ zipCode: 1 });

// Compound Index for both role + zipCode if we filter both so I will use this in that case
UserSchema.index({ role: 1, zipCode: 1 });

export default mongoose.model<IUser>('User', UserSchema);