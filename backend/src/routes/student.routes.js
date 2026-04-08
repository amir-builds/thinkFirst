import express from "express";
import {
  studentRegister,
  studentLogin,
  startStudentOAuth,
  handleStudentOAuthCallback,
  getCurrentStudent,
  studentLogout,
  updateStudentProfile,
  verifyStudentEmail,
  resendStudentOTP,
} from "../controllers/student.controller.js";
import { verifyStudentJWT } from "../middlewares/studentAuth.middleware.js";

const router = express.Router();

// Local auth
router.post("/register", studentRegister);
router.post("/login", studentLogin);
router.post("/verify-email", verifyStudentEmail);
router.post("/resend-otp", resendStudentOTP);

// OAuth
router.get("/oauth/:provider", startStudentOAuth);
router.get("/oauth/:provider/callback", handleStudentOAuthCallback);

// Protected routes
router.get("/current", verifyStudentJWT, getCurrentStudent);
router.post("/logout", verifyStudentJWT, studentLogout);
router.put("/profile", verifyStudentJWT, updateStudentProfile);

export default router;
