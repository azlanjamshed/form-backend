const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../../models/User");
const Submission = require("../../models/Submission");

const COLLECTOR_PERMISSIONS = ["dashboard.view", "submissions.view"];

// Generate a cryptographically secure temporary password.
const generateTemporaryPassword = () => {
  return crypto.randomBytes(18).toString("base64url");
};

// Keep sensitive account information out of API responses.
const formatCollector = (collector) => ({
  id: collector._id.toString(),
  name: collector.name,
  email: collector.email,
  role: collector.role,
  permissions: collector.permissions,
  formShareId: collector.formShareId,
  isActive: collector.isActive,
  createdAt: collector.createdAt,
  lastLoginAt: collector.lastLoginAt,
  totalSubmissions: collector.totalSubmissions ?? 0,
});

// Create a collector account.
const createCollector = async ({ name, email, createdBy }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("_id");

  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const temporaryPassword = generateTemporaryPassword();

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  try {
    const collector = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "staff",
      permissions: COLLECTOR_PERMISSIONS,
      createdBy,
      isActive: true,
      mustChangePassword: true,
    });

    return {
      collector: formatCollector(collector),
      temporaryPassword,
    };
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      const duplicateError = new Error(
        "An account with this email already exists.",
      );
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
};

// Get all collector accounts.
const getCollectors = async () => {
  const [collectors, submissionCounts] = await Promise.all([
    User.find({
      role: "staff",
    })
      .select(
        "name email role permissions formShareId isActive createdAt lastLoginAt",
      )
      .sort({ createdAt: -1 })
      .lean(),

    Submission.aggregate([
      {
        $match: {
          collectorId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$collectorId",
          totalSubmissions: { $sum: 1 },
        },
      },
    ]),
  ]);

  const countMap = new Map(
    submissionCounts.map((item) => [
      item._id.toString(),
      item.totalSubmissions,
    ]),
  );

  return collectors.map((collector) =>
    formatCollector({
      ...collector,
      totalSubmissions: countMap.get(collector._id.toString()) ?? 0,
    }),
  );
};

// Get one collector.
const getCollectorById = async (id) => {
  const collector = await User.findOne({
    _id: id,
    role: "staff",
  })
    .select(
      "name email role permissions formShareId isActive createdAt lastLoginAt",
    )
    .lean();

  if (!collector) {
    const error = new Error("Collector not found.");
    error.statusCode = 404;
    throw error;
  }

  return formatCollector(collector);
};

// Activate or deactivate a collector.
const updateCollectorStatus = async ({ id, isActive }) => {
  const collector = await User.findOneAndUpdate(
    {
      _id: id,
      role: "staff",
    },
    {
      $set: { isActive },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select(
      "name email role permissions formShareId isActive createdAt lastLoginAt",
    )
    .lean();

  if (!collector) {
    const error = new Error("Collector not found.");
    error.statusCode = 404;
    throw error;
  }

  return formatCollector(collector);
};

// Reset a collector's password.
const resetCollectorPassword = async (id) => {
  const collector = await User.findOne({
    _id: id,
    role: "staff",
  }).select("_id");

  if (!collector) {
    const error = new Error("Collector not found.");
    error.statusCode = 404;
    throw error;
  }

  const temporaryPassword = generateTemporaryPassword();

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  collector.passwordHash = passwordHash;
  collector.mustChangePassword = true;
  await collector.save();

  return {
    temporaryPassword,
  };
};
module.exports = {
  createCollector,
  getCollectors,
  getCollectorById,
  updateCollectorStatus,
  resetCollectorPassword,
};
