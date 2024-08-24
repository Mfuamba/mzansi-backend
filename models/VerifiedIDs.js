const mongoose = require('mongoose');

const VerifiedIDSchema = new mongoose.Schema({
    id: {
       type: String,
        required: true,
    }
}, { collection: 'VerifiedIDs' });

const VerifiedID = mongoose.model('VerifiedIDs', VerifiedIDSchema);

module.exports = VerifiedID;