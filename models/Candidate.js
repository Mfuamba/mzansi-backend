// models/Candidate.js

const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  age: {
    type: Number,
    required: false,
  },
  identityNo: {
    type: String,
    required: false,
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true,
  },
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true,
  },
});

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;
