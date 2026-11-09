const mongoose = require("mongoose");

const {
  saveDraft,
  getSubmissions,
  deleteSubmission,
  updateSubmissionSharing,
  getPublicSharedSubmission,
} = require("./submission.service");

// ==========================================
// Save Draft
// PUT /api/submissions/draft
// ==========================================

const saveDraftController = async (req, res, next) => {
  try {
    const { name, mobileNumber, consentGiven } = req.body || {};

    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must contain between 2 and 80 characters",
      });
    }

    if (typeof mobileNumber !== "string") {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const cleanMobileNumber = mobileNumber.trim();

    if (!/^[0-9]{10}$/.test(cleanMobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    if (consentGiven !== true) {
      return res.status(400).json({
        success: false,
        message: "Consent is required before saving your details",
      });
    }

    const result = await saveDraft({
      session: req.session,
      name: cleanName,
      mobileNumber: cleanMobileNumber,
      consentGiven,
    });

    // Persist the session before responding.
    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    return res.status(200).json({
      success: true,
      message: "Draft saved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get All Submissions
// GET /api/submissions
// ==========================================

const getAllSubmissions = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search || "";
    const status = req.query.status || "";

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters.",
      });
    }

    if (typeof search !== "string" || search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid search query.",
      });
    }

    const allowedStatuses = ["DRAFT", "STAGE_1_COMPLETED", "STAGE_2_COMPLETED"];

    if (
      typeof status !== "string" ||
      (status && !allowedStatuses.includes(status))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission status.",
      });
    }

    const result = await getSubmissions({
      page,
      limit,
      search,
      status,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Submission
// DELETE /api/submissions/:id
// ==========================================

const removeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID.",
      });
    }

    const result = await deleteSubmission(id);

    return res.status(200).json({
      success: true,
      message: "Submission deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateSharing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID.",
      });
    }

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Enabled must be true or false.",
      });
    }

    const result = await updateSubmissionSharing({
      id,
      enabled,
    });

    const clientUrl = process.env.CLIENT_ORIGIN || "http://localhost:5173";

    return res.status(200).json({
      success: true,
      message: enabled ? "Public sharing enabled." : "Public sharing disabled.",
      data: {
        shareEnabled: result.shareEnabled,
        publicShareId: result.publicShareId,
        shareUrl: enabled ? `${clientUrl}/user/${result.publicShareId}` : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Publicly retrieve a shared submission
const getPublicSubmission = async (req, res, next) => {
  try {
    const { publicShareId } = req.params;

    if (
      typeof publicShareId !== "string" ||
      !/^[a-f0-9]{32}$/i.test(publicShareId)
    ) {
      return res.status(404).json({
        success: false,
        message: "Shared submission not found.",
      });
    }

    const submission = await getPublicSharedSubmission(publicShareId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Shared submission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Exports
// ==========================================

module.exports = {
  saveDraftController,
  getAllSubmissions,
  removeSubmission,
  updateSharing,
  getPublicSubmission,
};
