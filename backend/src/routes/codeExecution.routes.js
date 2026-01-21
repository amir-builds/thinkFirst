import express from "express";
import {
  executeCode,
  getSupportedLanguagesController
} from "../controllers/codeExecution.controller.js";

const router = express.Router();

router.post("/execute", executeCode);
router.get("/languages", getSupportedLanguagesController);

export default router;
