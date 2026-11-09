const User = require("../models/User");

const requireRole = (...allowedRoles) => {
  // Validate roles when the middleware is created.
  const invalidRoles = allowedRoles.filter(
    (role) => !User.USER_ROLES.includes(role),
  );

  if (allowedRoles.length === 0 || invalidRoles.length > 0) {
    throw new Error(`Invalid or missing roles: ${invalidRoles.join(", ")}`);
  }

  return (req, res, next) => {
    // Authentication middleware must run first.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this resource",
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
