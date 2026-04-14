import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT token containing the user id
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// POST /api/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400);
      return next(new Error("Email already registered"));
    }

    // Password gets hashed by pre-save hook in User model
    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // matchPassword compares entered password with bcrypt hash
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      return next(new Error("Invalid email or password"));
    }

    // Block deactivated users
    if (!user.isActive) {
      res.status(403);
      return next(new Error("Account has been deactivated"));
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/auth/me
export const getMe = async (req, res) => {
  // req.user is attached by authMiddleware
  res.json(req.user);
};
