const { authenticateUser } = require("./auth.service");

const COOKIE_NAME = "verifyflow.token";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 8 * 60 * 60 * 1000,
});

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authenticateUser({
      email,
      password,
    });

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.cookie(COOKIE_NAME, result.token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  const { maxAge, ...clearOptions } = getCookieOptions();

  res.clearCookie(COOKIE_NAME, clearOptions);

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

// GET /api/auth/me
const getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  login,
  logout,
  getCurrentUser,
};
