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
  };

  return {
    token,
    user: safeUser,
  };
};

module.exports = {
  authenticateUser,
};
