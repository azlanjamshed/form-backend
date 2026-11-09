require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../src/config/db");
const User = require("../src/models/User");

const seedAdmin = async () => {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  // Validate environment variables
  if (!name || !email || !password) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  }

  if (password.length < 12) {
    throw new Error("Admin password must contain at least 12 characters.");
  }

  await connectDB();

  // Prevent duplicate admin creation
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role !== "admin") {
      throw new Error("This email already belongs to a non-admin account.");
    }

    console.log("Admin account already exists. No changes made.");
    return;
  }

  // Hash password before saving
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
    permissions: User.USER_PERMISSIONS,
    isActive: true,
  });

  console.log("Admin account created successfully!");
  console.log("Admin ID:", admin._id.toString());
  console.log("Admin Email:", admin.email);
};

seedAdmin()
  .catch((error) => {
    console.error("Admin seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
