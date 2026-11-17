const crypto = require("crypto");
const mongoose = require("mongoose");

const Submission = require("../../models/Submission");
const User = require("../../models/User");

const CONSENT_VERSION = "v1";

const resolveCollectorId = async (formShareId) => {
  if (!formShareId) {
    return null;
  }

  if (typeof formShareId !== "string" || !/^[a-f0-9]{32}$/i.test(formShareId)) {
    const error = new Error("Invalid collector sharing link.");
    error.statusCode = 400;
    throw error;
  }

  const collector = await User.findOne({
    formShareId,
    role: "staff",
    isActive: true,
  })
    .select("_id")
    .lean();

  if (!collector) {
    const error = new Error("Invalid or inactive collector link.");
    error.statusCode = 404;
    throw error;
  }

  return collector._id;
};

// const saveDraft = async ({
//   session,
//   name,
//   mobileNumber,
//   consentGiven,
//   formShareId,
// }) => {
//   if (consentGiven !== true) {
//     const error = new Error("Consent is required before saving your details");
//     error.statusCode = 400;
//     throw error;
//   }

//   if (!submission) {
//     const submissionKey = crypto.randomBytes(32).toString("hex");
//     const collectorId = await resolveCollectorId(formShareId);

//     submission = await Submission.create({
//       submissionKey,
//       name,
//       mobileNumber,
//       collectorId,
//       status: "DRAFT",
//       consentGivenAt: new Date(),
//       consentVersion: CONSENT_VERSION,
//     });

//     session.submissionKey = submissionKey;
//   } else {
//     submission.name = name;
//     submission.mobileNumber = mobileNumber;

//     if (!submission.consentGivenAt) {
//       submission.consentGivenAt = new Date();
//       submission.consentVersion = CONSENT_VERSION;
//     }

//     // Preserve the existing status and collector ownership.
//     await submission.save();
//   }

//   let submission = session.submissionKey
//     ? await Submission.findOne({
//         submissionKey: session.submissionKey,
//       })
//     : null;

//   // If the previous submission is completed,
//   // create a fresh submission for the new form attempt.
//   if (submission?.status === "STAGE_2_COMPLETED") {
//     submission = null;
//   }

//   if (!submission) {
//     const submissionKey = crypto.randomBytes(32).toString("hex");

//     submission = await Submission.create({
//       submissionKey,
//       name,
//       mobileNumber,
//       status: "DRAFT",
//       consentGivenAt: new Date(),
//       consentVersion: CONSENT_VERSION,
//     });

//     session.submissionKey = submissionKey;
//   } else {
//     submission.name = name;
//     submission.mobileNumber = mobileNumber;

//     if (!submission.consentGivenAt) {
//       submission.consentGivenAt = new Date();
//       submission.consentVersion = CONSENT_VERSION;
//     }

//     // Preserve the existing status.
//     await submission.save();
//   }

//   return {
//     status: submission.status,
//     updatedAt: submission.updatedAt,
//   };
// };

// Verify Stage 2 mobile number against Stage 1

const saveDraft = async ({
  session,
  name,
  mobileNumber,
  consentGiven,
  formShareId,
}) => {
  if (consentGiven !== true) {
    const error = new Error("Consent is required before saving your details");
    error.statusCode = 400;
    throw error;
  }

  // Validate the collector link when one is provided.
  // This ID is resolved from the database, never trusted from the client.
  const collectorId = await resolveCollectorId(formShareId);

  let submission = session.submissionKey
    ? await Submission.findOne({
        submissionKey: session.submissionKey,
      })
    : null;

  // A completed submission starts a fresh form attempt.
  if (submission?.status === "STAGE_2_COMPLETED") {
    submission = null;
  }

  if (!submission) {
    const submissionKey = crypto.randomBytes(32).toString("hex");

    submission = await Submission.create({
      submissionKey,
      name,
      mobileNumber,
      collectorId,
      status: "DRAFT",
      consentGivenAt: new Date(),
      consentVersion: CONSENT_VERSION,
    });

    session.submissionKey = submissionKey;
  } else {
    // Update the existing draft without changing collector ownership.
    submission.name = name;
    submission.mobileNumber = mobileNumber;

    if (!submission.consentGivenAt) {
      submission.consentGivenAt = new Date();
      submission.consentVersion = CONSENT_VERSION;
    }

    await submission.save();
  }

  return {
    status: submission.status,
    updatedAt: submission.updatedAt,
  };
};

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
  user,
}) => {
  const filter = {};

  if (!user?.id || !["admin", "staff"].includes(user.role)) {
    const error = new Error("You are not allowed to access submissions.");
    error.statusCode = 403;
    throw error;
  }

  // Collectors can only access their own submissions.
  if (user.role === "staff") {
    filter.collectorId = user.id;
  }

  // Preserve the ownership filter for global statistics.
  const ownershipFilter = { ...filter };
  const statisticsFilter =
    user.role === "staff"
      ? { collectorId: new mongoose.Types.ObjectId(user.id) }
      : {};

  // Search filter
  if (search.trim()) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), "i");

    filter.$or = [{ name: searchRegex }, { mobileNumber: searchRegex }];
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Normalize pagination values.
  const currentPage = Math.max(1, Number(page) || 1);
  const currentLimit = Math.min(100, Math.max(1, Number(limit) || 10));

  const skip = (currentPage - 1) * currentLimit;

  const [submissions, total, statistics] = await Promise.all([
    // Paginated submissions
    Submission.find(filter)
      .select(
        "name mobileNumber stageOneCode stageTwoCode toolpin status consentGivenAt consentVersion stageOneCompletedAt stageTwoCompletedAt createdAt updatedAt publicShareId shareEnabled",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    // Total matching filtered submissions
    Submission.countDocuments(filter),

    // Global statistics for the current user.
    // Search and status filters do not affect these counts.
    Submission.aggregate([
      {
        $match: statisticsFilter,
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const stats = {
    total: 0,
    draft: 0,
    stageOne: 0,
    stageTwo: 0,
  };

  statistics.forEach((item) => {
    stats.total += item.count;

    if (item._id === "DRAFT") {
      stats.draft = item.count;
    }

    if (item._id === "STAGE_1_COMPLETED") {
      stats.stageOne = item.count;
    }

    if (item._id === "STAGE_2_COMPLETED") {
      stats.stageTwo = item.count;
    }
  });

  return {
    submissions,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
    statistics: stats,
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
