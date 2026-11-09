const mongoose = require("mongoose");

const USER_ROLES = ["admin", "staff"];

const USER_PERMISSIONS = [
  "dashboard.view",

  "submissions.view",
  "submissions.delete",
  "submissions.share",

  "pageConfig.view",
  "pageConfig.update",
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Supports both current admin and future staff.
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },

    // Staff permissions will be assigned by admin later.
    // Admin receives full access through authorization middleware.
    permissions: {
      type: [
        {
          type: String,
          enum: USER_PERMISSIONS,
        },
      ],
      default: [],
    },

    // Identifies which admin created a staff account.
    // Not required for the initial seeded admin.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: function () {
        return this.role === "staff";
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

// Useful indexes.
userSchema.index({ role: 1, isActive: 1 });

// Reusable role and permission constants.
userSchema.statics.USER_ROLES = USER_ROLES;
userSchema.statics.USER_PERMISSIONS = USER_PERMISSIONS;

const User = mongoose.model("User", userSchema);

module.exports = User;
