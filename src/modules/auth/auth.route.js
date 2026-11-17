const express = require("express");
const { rateLimit } = require("express-rate-limit");

const {
  login,
  logout,
  getCurrentUser,
  changePassword,
} = require("./auth.controller");

const {
  requireAuth,
  requireSession,
} = require("../../middleware/auth.middleware");

const router = express.Router();

// Limit repeated login attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

// Limit repeated password-change attempts.
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-change attempts. Please try again later.",
  },
});

// POST /api/auth/login
router.post("/login", loginLimiter, login);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/me
// Allows users to retrieve mustChangePassword status.
router.get("/me", requireSession, getCurrentUser);

// POST /api/auth/change-password
// Allows authenticated users to change temporary passwords.
router.post(
  "/change-password",
  passwordChangeLimiter,
  requireSession,
  changePassword,
);

module.exports = router;
