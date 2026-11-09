const { getPageConfig, updatePageConfig } = require("./pageConfig.service");

// GET /api/page-config/public
const getPublicPageConfig = async (req, res, next) => {
  try {
    const config = await getPageConfig();

    return res.status(200).json({
      success: true,
      data: {
        heading: config.heading,
        stageTwoHeading: config.stageTwoHeading,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/page-config
const updatePublicPageConfig = async (req, res, next) => {
  try {
    const { heading, stageTwoHeading } = req.body || {};

    // Both headings are required.
    if (typeof heading !== "string" || typeof stageTwoHeading !== "string") {
      return res.status(400).json({
        success: false,
        message: "Both headings must be provided as text",
      });
    }

    const cleanHeading = heading.trim();
    const cleanStageTwoHeading = stageTwoHeading.trim();

    // Validate heading lengths.
    if (
      cleanHeading.length < 1 ||
      cleanHeading.length > 120 ||
      cleanStageTwoHeading.length < 1 ||
      cleanStageTwoHeading.length > 120
    ) {
      return res.status(400).json({
        success: false,
        message: "Headings must contain between 1 and 120 characters",
      });
    }

    const config = await updatePageConfig({
      heading: cleanHeading,
      stageTwoHeading: cleanStageTwoHeading,
    });

    return res.status(200).json({
      success: true,
      message: "Page configuration updated successfully",
      data: {
        heading: config.heading,
        stageTwoHeading: config.stageTwoHeading,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicPageConfig,
  updatePublicPageConfig,
};
