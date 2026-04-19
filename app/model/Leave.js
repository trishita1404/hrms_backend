const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  // Link this leave to a specific employee
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Casual Leave', 'Paid Leave', 'Unpaid Leave', 'Maternity/Paternity'],
    required: [true, 'Please specify the type of leave']
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for the leave'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  // Who approved/rejected this request
  processedBy: {
    type: mongoose.Schema.Types.Mixed, // Using Mixed to support your Static Admin ID
    ref: 'User'
  },
  adminMessage: {
    type: String, // Optional feedback from Admin (e.g., "Rejected due to project deadline")
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Leave', leaveSchema);   