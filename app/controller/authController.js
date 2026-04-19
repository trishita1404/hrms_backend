const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../helper/authHelper");

// @desc    Register Employee
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "employee",
    });

    res.status(201).json({ 
      message: "User registered successfully",
      user: { id: user._id, name: user.name, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login User & Set Refresh Cookie (Includes Static Admin/HR)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. STATIC ADMIN CHECK
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const adminUser = { _id: "static_admin_01", name: "System Admin", role: "admin" };
      const accessToken = generateAccessToken(adminUser);
      const refreshToken = generateRefreshToken(adminUser);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        _id: adminUser._id,
        name: adminUser.name,
        email: email,
        role: "admin",
        accessToken,
      });
    }

    // 2. STATIC HR CHECK
    if (email === process.env.HR_EMAIL && password === process.env.HR_PASSWORD) {
      const hrUser = { _id: "static_hr_01", name: "HR Manager", role: "hr" };
      const accessToken = generateAccessToken(hrUser);
      const refreshToken = generateRefreshToken(hrUser);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        _id: hrUser._id,
        name: hrUser.name,
        email: email,
        role: "hr",
        accessToken,
      });
    }

    // 3. DYNAMIC EMPLOYEE CHECK
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "employee",
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh Access Token
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // FIX: Check for Static users using the correct IDs
    if (decoded.id === 'static_admin_01' || decoded._id === 'static_admin_01') {
        const accessToken = generateAccessToken({ _id: 'static_admin_01', role: 'admin', name: 'System Admin' });
        return res.json({ accessToken });
    }

    if (decoded.id === 'static_hr_01' || decoded._id === 'static_hr_01') {
        const accessToken = generateAccessToken({ _id: 'static_hr_01', role: 'hr', name: 'HR Manager' });
        return res.json({ accessToken });
    }

    const user = await User.findById(decoded.id || decoded._id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Session expired" });
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Logout
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, refresh, logout };