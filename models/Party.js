const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    regNum: {
        type: String,
        required: true,
        unique: true, // Ensure each party has a unique registration number
        trim: true,
    },
    partyAbbrev: {
        type: String,
        required: true,
        trim: true,
    },
    election: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Election', // Reference to the Election model
        required: true,
    },
    description: {
        type: String,
        trim: true,
    },
    logo: {
        type: String, // Store the URL or path of the uploaded logo
        required: false,
    },
    officeTel: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Party = mongoose.model('Party', PartySchema);
module.exports = Party;
