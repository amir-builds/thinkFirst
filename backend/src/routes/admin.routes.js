import express from "express";
import {
  adminLogin,
  adminVerifyOTP,
  adminLogout,
  getCurrentAdmin
} from "../controllers/admin.controller.js";
import { verifyAdminJWT } from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/verify-otp", adminVerifyOTP);
router.post("/logout", verifyAdminJWT, adminLogout);
router.get("/current", verifyAdminJWT, getCurrentAdmin);

export default router;
