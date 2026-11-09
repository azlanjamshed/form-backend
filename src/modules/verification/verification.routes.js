const express = require("express");

const { stageOne, stageTwo } = require("./verification.controller");

const router = express.Router();

// Complete Stage 1
router.post("/stage-one", stageOne);

// Complete Stage 2
router.post("/stage-two", stageTwo);

module.exports = router;
