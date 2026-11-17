const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireSession = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from environment variables");
    }

    const token = req.cookies?.["verifyflow.token"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    if (typeof decoded.sub !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const user = await User.findById(decoded.sub).select(
      "name email role permissions isActive mustChangePassword formShareId",
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or account inactive",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      mustChangePassword:
        user.role === "staff" && user.mustChangePassword === true,
      ...(user.role === "staff" && {
        formShareId: user.formShareId,
      }),
    };
    next();
  } catch (error) {
    next(error);
  }
};

const requireAuth = async (req, res, next) => {
  await requireSession(req, res, (error) => {
    if (error) return next(error);

    if (req.user?.mustChangePassword) {
      return res.status(403).json({
        success: false,
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your temporary password before continuing.",
      });
    }

    next();
  });
};

module.exports = {
  requireAuth,
  requireSession,
};
