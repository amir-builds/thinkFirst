import express from "express";
import {
  createQuestion,
  getAllQuestions,
  getPublicQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  toggleQuestionPublic
} from "../controllers/question.controller.js";
import { verifyAdminJWT } from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

// Public routes
router.get("/public", getPublicQuestions);

// Admin routes
router.post("/create", verifyAdminJWT, createQuestion);
router.get("/all", verifyAdminJWT, getAllQuestions);
router.get("/:id", getQuestionById);
router.put("/update/:id", verifyAdminJWT, updateQuestion);
router.delete("/delete/:id", verifyAdminJWT, deleteQuestion);
router.put("/toggle-public/:id", verifyAdminJWT, toggleQuestionPublic);

export default router;
