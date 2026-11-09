const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const authRoutes = require("./modules/auth/auth.route");
const pageConfigRoutes = require("./modules/pageConfig/pageConfig.routes");
const submissionRoutes = require("./modules/submissions/submission.routes");
const verificationRoutes = require("./modules/verification/verification.routes");

const app = express();

// Validate session secret.
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from environment variables");
}

// Production proxy configuration.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security middleware.
app.use(helmet());

// Cookie parser (required for JWT authentication).
app.use(cookieParser());

// CORS configuration.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

// Body parser.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// Express session configuration.
app.use(
  session({
    name: "verifyflow.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 7 * 24 * 60 * 60,
    }),

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

// API routes.
app.use("/api/auth", authRoutes);
app.use("/api/page-config", pageConfigRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/verification", verificationRoutes);

// Health check.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VerifyFlow API is running",
  });
});

// 404 handler.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Central error handler.
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

module.exports = app;
