// const User = require("../models/User");

// const requirePermission = (permission) => {
//   // Validate permission when the middleware is created.
//   if (!User.USER_PERMISSIONS.includes(permission)) {
//     throw new Error(`Invalid permission: ${permission}`);
//   }

//   return (req, res, next) => {
//     // Authentication middleware must run first.
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required",
//       });
//     }

//     const hasPermission = req.user.permissions?.includes(permission);

//     if (!hasPermission) {
//       return res.status(403).json({
//         success: false,
//         message: "You do not have permission to perform this action",
//       });
//     }

//     next();
//   };
// };

// module.exports = {
//   requirePermission,
// };

const User = require("../models/User");

const requirePermission = (permission) => {
  if (!User.USER_PERMISSIONS.includes(permission)) {
    throw new Error(`Invalid permission: ${permission}`);
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Admins automatically have access to permission-protected routes.
    if (req.user.role === "admin") {
      return next();
    }

    const hasPermission = req.user.permissions?.includes(permission);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = {
  requirePermission,
};
