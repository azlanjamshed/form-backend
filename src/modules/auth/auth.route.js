const express = require("express");
const { rateLimit } = require("express-rate-limit");

const { login, logout, getCurrentUser } = require("./auth.controller");

const { requireAuth } = require("../../middleware/auth.middleware");

const router = express.Router();

// Limit repeated login attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

// POST /api/auth/login
router.post("/login", loginLimiter, login);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/me
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
