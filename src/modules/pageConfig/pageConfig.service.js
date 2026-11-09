const PageConfig = require("../../models/PageConfig");

const CONFIG_ID = "public-page-config";

// Get existing configuration or create defaults.
const getPageConfig = async () => {
  return PageConfig.findByIdAndUpdate(
    CONFIG_ID,
    {
      $setOnInsert: {
        _id: CONFIG_ID,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );
};

// Update public page headings.
const updatePageConfig = async ({ heading, stageTwoHeading }) => {
  return PageConfig.findByIdAndUpdate(
    CONFIG_ID,
    {
      $set: {
        heading,
        stageTwoHeading,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );
};

module.exports = {
  getPageConfig,
  updatePageConfig,
};
