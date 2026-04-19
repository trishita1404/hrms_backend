const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Assuming you use JWT for immediate login after signup

// @desc    Register a new Candidate (Public)
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with "candidate" role explicitly
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'candidate' // Outsiders are always candidates
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: "Candidate registered successfully"
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id; 

    // Handle Static Admin/HR
    if (userId === "static_admin_01" || userId === "static_hr_01") {
      return res.status(200).json({
        _id: userId,
        name: name || req.user.name,
        email: email || req.user.email,
        role: req.user.role
      });
    }

    // Handle Regular Employees and Candidates
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, email } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update Password
const updatePassword = async (req, res) => {
  try {
    const userId = req.user._id;

    if (userId === "static_admin_01" || userId === "static_hr_01") {
      return res.status(200).json({ 
        message: "System account verified. Password update simulated." 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser, // Exported the new function
  updateUserProfile,
  getUserProfile: async (req, res) => res.json(req.user), 
  updatePassword
};