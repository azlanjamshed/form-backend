const mongoose = require("mongoose");

const {
  createCollector,
  getCollectors,
  getCollectorById,
  updateCollectorStatus,
  resetCollectorPassword,
} = require("./collector.service");

// POST /api/collectors
const createCollectorController = async (req, res, next) => {
  try {
    const { name, email } = req.body || {};

    if (typeof name !== "string" || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must contain between 2 and 80 characters.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    const result = await createCollector({
      name: cleanName,
      email: cleanEmail,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Collector account created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/collectors
const getAllCollectorsController = async (req, res, next) => {
  try {
    const collectors = await getCollectors();

    return res.status(200).json({
      success: true,
      data: {
        collectors,
        total: collectors.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/collectors/:id
const getCollectorController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collector ID.",
      });
    }

    const collector = await getCollectorById(id);

    return res.status(200).json({
      success: true,
      data: collector,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/collectors/:id/status
const updateCollectorStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collector ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const collector = await updateCollectorStatus({
      id,
      isActive,
    });

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Collector activated successfully."
        : "Collector deactivated successfully.",
      data: collector,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/collectors/:id/reset-password
const resetCollectorPasswordController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collector ID.",
      });
    }

    const result = await resetCollectorPassword(id);

    return res.status(200).json({
      success: true,
      message: "Collector password reset successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCollectorController,
  getAllCollectorsController,
  getCollectorController,
  updateCollectorStatusController,
  resetCollectorPasswordController,
};
