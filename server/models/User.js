const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    bio: {
        type: String,
        trim: true,
        default: ""
    },

    phone: {
        type: String,
        trim: true,
        default: ""
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: String,
    averageRating: {
        type: Number,
        default: 0
    },
    emergencyContact: {
        name: { type: String, default: "" },
        phone: { type: String, default: "" }
    },
    profilePicture: {
        type: String,
        default: ""
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);