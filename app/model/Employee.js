const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    required: [true, 'Please specify a role'],
    trim: true,
    default: 'Developer'
  },
  department: {
    type: String,
    trim: true,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  joinedDate: {
    type: Date,
    required: [true, 'Please add a joining date']
  },
  cvUrl: {
    type: String,
    default: ''
  },
  contactInfo: {
    type: String,
    trim: true
  },
  // FIX: Track who added the employee using 'Mixed' type
  // This allows both your "static_admin_01" string AND real MongoDB ObjectIds
  addedBy: {
    type: mongoose.Schema.Types.Mixed, 
    ref: 'User', 
    required: true
  }
}, {
  timestamps: true 
});

module.exports = mongoose.model('Employee', employeeSchema);