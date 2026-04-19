const express = require("express");
const router = express.Router();
const { 
  register, 
  login, 
  refresh, 
  logout   
} = require("../controller/authController");

// Public Routes
router.post("/register", register);
router.post("/login", login);

// Token Refresh Route (Crucial for fixing "JWT Expired")
router.post("/refresh", refresh);

// Logout Route
router.post("/logout", logout);

module.exports = router;