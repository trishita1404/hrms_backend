const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }], 
  location: { type: String, default: 'Remote' },
  salary: { type: String },
  type: { 
    type: String, 
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], 
    default: 'Full-time' 
  },
  status: { 
    type: String, 
    enum: ['Open', 'Closed'], 
    default: 'Open' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);