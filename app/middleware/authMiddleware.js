const jwt = require("jsonwebtoken");
const User = require("../model/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Check for Bearer token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify token using the secret from your .env
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      // 3. Extract ID (Flexible check for 'id' or '_id')
      // Your helper uses 'id', so we check that first
      const userId = decoded.id || decoded._id;

      // 4. Handle Static Admin/HR
      // We map these to 24-character hex strings so MongoDB doesn't crash on Job creation
      if (userId === "static_admin_01") {
        req.user = { 
          _id: "000000000000000000000001", 
          id: "static_admin_01", 
          name: "System Admin", 
          role: "admin" 
        };
        return next();
      }
      
      if (userId === "static_hr_01") {
        req.user = { 
          _id: "000000000000000000000002", 
          id: "static_hr_01", 
          name: "HR Manager", 
          role: "hr" 
        };
        return next();
      }

      // 5. Handle Database Users (Real Employees)
      req.user = await User.findById(userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      return next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      // This sends the 401 you see in the frontend
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // 6. If no token was found at all
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Middleware to restrict access based on user roles
 */
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

// Helper middleware for common Admin/HR routes
const admin = authorize('admin', 'hr');

module.exports = { protect, authorize, admin }; 