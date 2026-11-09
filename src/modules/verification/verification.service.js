const Submission = require("../../models/Submission");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Complete Stage 1
const completeStageOne = async ({ session, name, mobileNumber }) => {
  if (!session?.submissionKey) {
    throw createError("Your session has expired. Please start again.", 401);
  }

  const submission = await Submission.findOne({
    submissionKey: session.submissionKey,
  });

  if (!submission) {
    throw createError("Draft not found. Please start again.", 404);
  }

  if (!submission.consentGivenAt) {
    throw createError("Consent is required before proceeding.");
  }

  if (submission.status === "STAGE_2_COMPLETED") {
    throw createError("This submission has already been completed.", 409);
  }

  submission.name = name;
  submission.mobileNumber = mobileNumber;
  submission.status = "STAGE_1_COMPLETED";

  submission.stageOneCompletedAt = new Date();

  await submission.save();

  return {
    status: submission.status,
    completedAt: submission.stageOneCompletedAt,
  };
};

// Complete Stage 2
const completeStageTwo = async ({ session, mobileNumber }) => {
  if (!session?.submissionKey) {
    throw createError("Your session has expired. Please start again.", 401);
  }

  const submission = await Submission.findOne({
    submissionKey: session.submissionKey,
  });

  if (!submission) {
    throw createError("Submission not found.", 404);
  }

  if (submission.status === "STAGE_2_COMPLETED") {
    return {
      status: submission.status,
      completedAt: submission.stageTwoCompletedAt,
    };
  }

  if (submission.status !== "STAGE_1_COMPLETED") {
    throw createError("Please complete Stage 1 first.", 409);
  }

  if (submission.mobileNumber !== mobileNumber) {
    throw createError("Mobile number does not match Stage 1.", 400);
  }

  submission.status = "STAGE_2_COMPLETED";
  submission.stageTwoCompletedAt = new Date();

  await submission.save();

  return {
    status: submission.status,
    completedAt: submission.stageTwoCompletedAt,
  };
};

module.exports = {
  completeStageOne,
  completeStageTwo,
};
