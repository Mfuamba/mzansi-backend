const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    id: {
        type: String,
        unique: true,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    province: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    hasVoted: {
        type: Boolean,
        default: false,  // Initialize with false
      },
    walletAddress: {
        type: String,
        required: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const User = mongoose.model('users', UserSchema);
module.exports = User;