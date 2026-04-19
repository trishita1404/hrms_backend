const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Link this application to a specific job
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  // Store the title at the time of application for quick reference
  jobTitle: { 
    type: String, 
    required: true 
  },
  candidateName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  resumeLink: { 
    type: String, 
    required: true 
  },
  coverLetter: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);