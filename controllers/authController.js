import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT token containing the user id

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};


