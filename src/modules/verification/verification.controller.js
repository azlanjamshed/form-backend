// const {
//   completeStageOne,
//   completeStageTwo,
// } = require("./verification.service");

// // Stage 1 Controller
// const stageOne = async (req, res, next) => {
//   try {
//     const { name, mobileNumber } = req.body;

//     // Validate name
//     if (
//       typeof name !== "string" ||
//       name.trim().length < 2 ||
//       name.trim().length > 80
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Name must be between 2 and 80 characters.",
//       });
//     }

//     // Validate mobile number
//     if (typeof mobileNumber !== "string" || !/^[0-9]{10}$/.test(mobileNumber)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please enter a valid 10-digit mobile number.",
//       });
//     }

//     const result = await completeStageOne({
//       session: req.session,
//       name: name.trim(),
//       mobileNumber,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Stage 1 completed successfully.",
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Stage 2 Controller
// const stageTwo = async (req, res, next) => {
//   try {
//     const { mobileNumber } = req.body;

//     // Validate mobile number
//     if (typeof mobileNumber !== "string" || !/^[0-9]{10}$/.test(mobileNumber)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please enter a valid 10-digit mobile number.",
//       });
//     }

//     const result = await completeStageTwo({
//       session: req.session,
//       mobileNumber,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Verification completed successfully.",
//       data: result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   stageOne,
//   stageTwo,
// };

const {
  completeStageOne,
  completeStageTwo,
} = require("./verification.service");

// Stage 1 Controller
const stageOne = async (req, res, next) => {
  try {
    const { name, mobileNumber, stageOneCode } = req.body;

    // Validate name
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters.",
      });
    }

    // Validate mobile number
    if (typeof mobileNumber !== "string" || !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // Validate Stage 1 demo code
    if (
      stageOneCode !== undefined &&
      (typeof stageOneCode !== "string" || stageOneCode.length > 50)
    ) {
      return res.status(400).json({
        success: false,
        message: "Stage 1 test code must be a string of up to 50 characters.",
      });
    }

    const result = await completeStageOne({
      session: req.session,
      name: name.trim(),
      mobileNumber,
      stageOneCode,
    });

    return res.status(200).json({
      success: true,
      message: "Stage 1 completed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Stage 2 Controller
const stageTwo = async (req, res, next) => {
  try {
    const { mobileNumber, stageTwoCode } = req.body;

    // Validate mobile number
    if (typeof mobileNumber !== "string" || !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // Validate Stage 2 demo code
    if (
      stageTwoCode !== undefined &&
      (typeof stageTwoCode !== "string" || stageTwoCode.length > 50)
    ) {
      return res.status(400).json({
        success: false,
        message: "Stage 2 test code must be a string of up to 50 characters.",
      });
    }

    const result = await completeStageTwo({
      session: req.session,
      mobileNumber,
      stageTwoCode,
    });

    return res.status(200).json({
      success: true,
      message: "Verification completed successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  stageOne,
  stageTwo,
};
