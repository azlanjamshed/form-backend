const mongoose = require("mongoose");

const pageConfigSchema = new mongoose.Schema(
  {
    // Fixed ID ensures we maintain a single public page configuration.
    _id: {
      type: String,
      default: "public-page-config",
    },

    heading: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
      default: "Enter your details",
    },

    stageTwoHeading: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
      default: "Confirm your mobile number",
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

const PageConfig = mongoose.model("PageConfig", pageConfigSchema);

module.exports = PageConfig;
