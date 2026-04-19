const jwt = require("jsonwebtoken");
const User = require("../model/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      const userId = decoded.id || decoded._id;

      // --- FIX START: Handle Static Admin/HR without hitting MongoDB ---
      if (userId === "static_admin_01") {
        req.user = { _id: "static_admin_01", name: "System Admin", role: "admin" };
        return next();
      }
      
      if (userId === "static_hr_01") {
        req.user = { _id: "static_hr_01", name: "HR Manager", role: "hr" };
        return next();
      }
      // --- FIX END ---

      // For real employees, we check the database
      req.user = await User.findById(userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      return next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user?.role || 'unknown'}) is not allowed to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };