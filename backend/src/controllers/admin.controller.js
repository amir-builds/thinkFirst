import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redisClient from "../utils/redisClient.js";
import nodemailer from "nodemailer";

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const adminInstance = new Admin(req.app.locals.db);
  const admin = await adminInstance.findByEmail(email);
  
  if (!admin) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const otp = generateOTP(6);
  const key = `otp:${email}`;
  
  await redisClient.setEx(key, 300, JSON.stringify({ otp, adminId: admin.id }));

  // Send OTP email (with fallback for dev)
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your Admin Login OTP",
      text: `Your OTP is: ${otp}. Valid for 5 minutes.`,
      html: `<p>Your OTP is: <strong>${otp}</strong>. Valid for 5 minutes.</p>`
    });
    res.json(new ApiResponse(200, null, "OTP sent to your email"));
  } catch (emailError) {
    console.error("Email error:", emailError.message);
    // In development, return OTP in response if email fails
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
      res.json(new ApiResponse(200, { otp }, "OTP generated (email failed, showing in dev mode)"));
    } else {
      throw new ApiError(500, "Failed to send OTP email");
    }
  }
});

export const adminVerifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const key = `otp:${email}`;
  const data = await redisClient.get(key);

  if (!data) {
    throw new ApiError(400, "OTP expired or invalid");
  }

  const { otp: storedOtp, adminId } = JSON.parse(data);

  if (otp !== storedOtp) {
    throw new ApiError(400, "Invalid OTP");
  }

  await redisClient.del(key);

  const adminInstance = new Admin(req.app.locals.db);
  const admin = await adminInstance.findById(adminId);

  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );

  const refreshToken = jwt.sign(
    { id: admin.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000
  });

  res.cookie("adminRefreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json(new ApiResponse(200, {
    admin: { id: admin.id, name: admin.name, email: admin.email }
  }, "Login successful"));
});

export const adminLogout = asyncHandler(async (req, res) => {
  res.clearCookie("adminToken");
  res.clearCookie("adminRefreshToken");
  res.json(new ApiResponse(200, null, "Logout successful"));
});

export const getCurrentAdmin = asyncHandler(async (req, res) => {
  const adminInstance = new Admin(req.app.locals.db);
  const admin = await adminInstance.findById(req.admin.id);
  
  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  res.json(new ApiResponse(200, {
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
  }));
});
