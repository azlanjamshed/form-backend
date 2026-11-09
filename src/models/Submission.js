const mongoose = require("mongoose");
const crypto = require("crypto");
const submissionSchema = new mongoose.Schema(
  {
    // Server-generated identifier associated with
    // the anonymous browser session.
    submissionKey: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },

    // Stage 1 information
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    mobileNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },

    // Submission progress
    status: {
      type: String,
      enum: ["DRAFT", "STAGE_1_COMPLETED", "STAGE_2_COMPLETED"],
      default: "DRAFT",
      required: true,
    },

    // Consent audit information.
    // These remain null until the backend explicitly
    // receives and records consent.
    consentGivenAt: {
      type: Date,
      default: null,
    },

    consentVersion: {
      type: String,
      default: null,
    },

    // Completion timestamps
    stageOneCompletedAt: {
      type: Date,
      default: null,
    },

    stageTwoCompletedAt: {
      type: Date,
      default: null,
    },
    publicShareId: {
      type: String,
      unique: true,
      immutable: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },

    shareEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,

    // Reject fields that are not defined in this schema.
    // This provides an additional safeguard against
    // accidentally storing demoCode.
    strict: "throw",
  },
);

// Useful indexes for admin searches and filtering.
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ mobileNumber: 1 });
submissionSchema.index({ name: 1 });

// Export model.
const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;
