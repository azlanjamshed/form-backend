const express = require("express");

const {
  getPublicPageConfig,
  updatePublicPageConfig,
} = require("./pageConfig.controller");

const { requireAuth } = require("../../middleware/auth.middleware");

const { requireRole } = require("../../middleware/role.middleware");

const { requirePermission } = require("../../middleware/permission.middleware");

const router = express.Router();

// GET /api/page-config/public
// Public endpoint: no authentication required.
router.get("/public", getPublicPageConfig);

// PUT /api/page-config
// Protected endpoint: authentication + permission required.
router.put(
  "/",
  requireAuth,
  requireRole("admin"),
  requirePermission("pageConfig.update"),
  updatePublicPageConfig,
);

module.exports = router;
