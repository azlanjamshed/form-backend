const crypto = require("crypto");

const Submission = require("../../models/Submission");

const CONSENT_VERSION = "v1";

const saveDraft = async ({ session, name, mobileNumber, consentGiven }) => {
  if (consentGiven !== true) {
    const error = new Error("Consent is required before saving your details");
    error.statusCode = 400;
    throw error;
  }

  if (!session) {
    throw new Error("Public session is unavailable");
  }

  let submission = session.submissionKey
    ? await Submission.findOne({
        submissionKey: session.submissionKey,
      })
    : null;

  // If the previous submission is completed,
  // create a fresh submission for the new form attempt.
  if (submission?.status === "STAGE_2_COMPLETED") {
    submission = null;
  }

  if (!submission) {
    const submissionKey = crypto.randomBytes(32).toString("hex");

    submission = await Submission.create({
      submissionKey,
      name,
      mobileNumber,
      status: "DRAFT",
      consentGivenAt: new Date(),
      consentVersion: CONSENT_VERSION,
    });

    session.submissionKey = submissionKey;
  } else {
    submission.name = name;
    submission.mobileNumber = mobileNumber;

    if (!submission.consentGivenAt) {
      submission.consentGivenAt = new Date();
      submission.consentVersion = CONSENT_VERSION;
    }

    // Preserve the existing status.
    await submission.save();
  }

  return {
    status: submission.status,
    updatedAt: submission.updatedAt,
  };
};

// Verify Stage 2 mobile number against Stage 1
const verifyStageTwoMobileNumber = async ({ session, mobileNumber }) => {
  if (!session?.submissionKey) {
    const error = new Error(
      "Stage 1 submission not found. Please complete Stage 1 first.",
    );
    error.statusCode = 404;
    throw error;
  }

  const submission = await Submission.findOne({
    submissionKey: session.submissionKey,
  })
    .select("mobileNumber status")
    .lean();

  if (!submission) {
    const error = new Error("Submission not found.");
    error.statusCode = 404;
    throw error;
  }

  if (submission.status !== "STAGE_1_COMPLETED") {
    const error = new Error("Please complete Stage 1 first.");
    error.statusCode = 400;
    throw error;
  }

  if (submission.mobileNumber !== mobileNumber) {
    const error = new Error(
      "Mobile number does not match the number entered in Stage 1.",
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    verified: true,
  };
};
// Escape special regex characters in search input
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Get submissions with pagination and filters
const getSubmissions = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
}) => {
  const filter = {};

  if (search.trim()) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), "i");

    filter.$or = [{ name: searchRegex }, { mobileNumber: searchRegex }];
  }

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .select(
        "name mobileNumber stageOneCode stageTwoCode toolpin status consentGivenAt consentVersion stageOneCompletedAt stageTwoCompletedAt createdAt updatedAt publicShareId shareEnabled",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Submission.countDocuments(filter),
  ]);

  return {
    submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Delete a submission
const deleteSubmission = async (id) => {
  const submission = await Submission.findByIdAndDelete(id);

  if (!submission) {
    const error = new Error("Submission not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: submission._id,
  };
};

// Enable or disable public sharing
const updateSubmissionSharing = async ({ id, enabled }) => {
  const submission = await Submission.findById(id);

  if (!submission) {
    const error = new Error("Submission not found.");
    error.statusCode = 404;
    throw error;
  }

  // Only completed submissions can be shared.
  if (enabled === true && submission.status !== "STAGE_2_COMPLETED") {
    const error = new Error("Only completed submissions can be shared.");
    error.statusCode = 400;
    throw error;
  }

  submission.shareEnabled = enabled;

  await submission.save();

  return {
    shareEnabled: submission.shareEnabled,
    publicShareId: submission.publicShareId,
    status: submission.status,
  };
};

// Get a publicly shared submission
const getPublicSharedSubmission = async (publicShareId) => {
  const submission = await Submission.findOne({
    publicShareId,
    shareEnabled: true,
    status: "STAGE_2_COMPLETED",
  })
    .select(
      "name mobileNumber stageOneCode stageTwoCode toolpin status consentGivenAt consentVersion stageOneCompletedAt stageTwoCompletedAt createdAt updatedAt publicShareId shareEnabled",
    )
    .lean();

  return submission;
};

const saveToolPin = async ({ session, toolpin }) => {
  if (!session?.submissionKey) {
    const error = new Error("Submission session not found.");
    error.statusCode = 404;
    throw error;
  }

  const submission = await Submission.findOne({
    submissionKey: session.submissionKey,
  });

  if (!submission) {
    const error = new Error("Submission not found.");
    error.statusCode = 404;
    throw error;
  }

  // Lucky Number can only be saved after Stage 2 is completed.
  if (submission.status !== "STAGE_2_COMPLETED") {
    const error = new Error(
      "Complete Stage 2 before submitting your lucky number.",
    );
    error.statusCode = 400;
    throw error;
  }

  submission.toolpin = toolpin;

  await submission.save();

  return {
    success: true,
    updatedAt: submission.updatedAt,
  };
};

module.exports = {
  saveDraft,
  getSubmissions,
  deleteSubmission,
  updateSubmissionSharing,
  getPublicSharedSubmission,
  saveToolPin,
  verifyStageTwoMobileNumber,
};
