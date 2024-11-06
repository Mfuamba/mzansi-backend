// models/Election.js

const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: { 
    type: String, 
    required: true ,
  }, // 'UPCOMING', 'ACTIVE', 'PAST'
  type: { 
    type: String, 
    required: true,

   },
  parties: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Election = mongoose.model('Election', ElectionSchema);
module.exports = Election;