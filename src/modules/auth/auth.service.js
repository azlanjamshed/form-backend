const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

const authenticateUser = async ({ email, password }) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find user and explicitly include passwordHash.
  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+passwordHash");

  // Use a generic error for invalid credentials.
  if (!user || !user.isActive) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  // Record the successful login time.
  user.lastLoginAt = new Date();
  await user.save();

  // Generate JWT.
  const token = jwt.sign(
    {
      sub: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
      algorithm: "HS256",
    },
  );

  // Never expose passwordHash to the client.
  const safeUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    mustChangePassword:
      user.role === "staff" && user.mustChangePassword === true,
    lastLoginAt: user.lastLoginAt,
    ...(user.role === "staff" && {
      formShareId: user.formShareId,
    }),
  };

  return {
    token,
    user: safeUser,
  };
};

const changeUserPassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+passwordHash");

  if (!user || !user.isActive) {
    const error = new Error("User not found or account inactive.");
    error.statusCode = 404;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error(
      "New password must be different from your current password.",
    );
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);

  if (user.role === "staff") {
    user.mustChangePassword = false;
  }

  await user.save();

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: false,
  };
};

module.exports = {
  authenticateUser,
  changeUserPassword,
};
