const express = require("express");

const {
  createCollectorController,
  getAllCollectorsController,
  getCollectorController,
  updateCollectorStatusController,
  resetCollectorPasswordController,
} = require("./collector.controller");

const { requireAuth } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");

const router = express.Router();

// All collector management endpoints are admin-only.
router.use(requireAuth, requireRole("admin"));

// POST /api/collectors - Create collector
router.post("/", createCollectorController);

// GET /api/collectors - List collectors
router.get("/", getAllCollectorsController);

// GET /api/collectors/:id - Get collector details
router.get("/:id", getCollectorController);

// PATCH /api/collectors/:id/status - Activate/deactivate collector
router.patch("/:id/status", updateCollectorStatusController);

// POST /api/collectors/:id/reset-password
router.post("/:id/reset-password", resetCollectorPasswordController);

module.exports = router;
