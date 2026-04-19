const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a holiday title"],
    trim: true
  },
  date: {
    type: Date,
    required: [true, "Please provide a holiday date"]
  },
  type: {
    type: String,
    enum: ['Public', 'Company', 'Festive', 'Other'],
    default: 'Public'
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);