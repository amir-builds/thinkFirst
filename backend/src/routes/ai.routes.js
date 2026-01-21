import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { evaluatePlan } from "../services/ai.service.js";

const router = Router();

router.post(
  "/mentor",
  asyncHandler(async (req, res) => {
    const { problem, plan } = req.body;

    if (!problem || typeof problem !== "string") {
      throw new ApiError(400, "Problem description is required");
    }

    if (plan === undefined || typeof plan !== "string") {
      throw new ApiError(400, "Plan is required");
    }

    // Use streaming for real-time response
    try {
      await evaluatePlan(problem, plan, res);
    } catch (error) {
      console.error('Streaming error:', error.message);
      if (!res.headersSent) {
        res.status(500).json(new ApiResponse(500, null, "Error generating feedback"));
      }
    }
  })
);

router.post(
  "/reflection",
  asyncHandler(async (req, res) => {
    const { problem, plan, code, error } = req.body;

    if (!problem || typeof problem !== "string") {
      throw new ApiError(400, "Problem description is required");
    }

    if (!plan || typeof plan !== "string") {
      throw new ApiError(400, "Plan is required");
    }

    if (!code || typeof code !== "string") {
      throw new ApiError(400, "Code is required");
    }

    if (!error || typeof error !== "string") {
      throw new ApiError(400, "Error description is required");
    }

    const reflectionQuestions = [
      "Looking at your error, which part of your plan might not match what your code is doing?",
      "What did you expect to happen at the point where the error occurred?",
      "Can you trace through your code with a simple example and see where it differs from your plan?",
      "What assumption in your plan might not hold true for this case?",
      "If you had to explain this error to a friend, what would you say went wrong?"
    ];

    const randomIndex = Math.floor(Math.random() * reflectionQuestions.length);
    const message = reflectionQuestions[randomIndex];

    return res.status(200).json(new ApiResponse(200, { message }, "Reflection question generated"));
  })
);

export default router;
