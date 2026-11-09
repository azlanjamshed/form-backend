const express = require("express");

const {
  saveDraftController,
  getAllSubmissions,
  removeSubmission,
  updateSharing,
  getPublicSubmission,
} = require("./submission.controller");

const { requireAuth } = require("../../middleware/auth.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");

const router = express.Router();

// Public: Save draft
router.put("/draft", saveDraftController);

// Public: View a shared, completed submission
router.get("/public/:publicShareId", getPublicSubmission);

// Admin/staff: View submissions
router.get(
  "/",
  requireAuth,
  requirePermission("submissions.view"),
  getAllSubmissions,
);

// Admin/staff: Delete submission
router.delete(
  "/:id",
  requireAuth,
  requirePermission("submissions.delete"),
  removeSubmission,
);

// Admin/staff: Enable or disable public sharing
router.patch(
  "/:id/sharing",
  requireAuth,
  requirePermission("submissions.share"),
  updateSharing,
);

module.exports = router;
