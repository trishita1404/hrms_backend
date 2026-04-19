const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      // Added 'candidate' to the enum
      enum: ["admin", "hr", "employee", "candidate"],
      default: "employee",
    },
    // Reference to detailed employee profile
    employeeDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    // Optional: Reference to candidate-specific data (resume, portfolio link, etc.)
    candidateDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate", 
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);