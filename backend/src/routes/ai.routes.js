import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { evaluatePlan, guidedThinking } from "../services/ai.service.js";
import {
  getOrCreateSessionId,
  getConversationHistory,
  addMessageToHistory,
  formatHistoryForGemini,
  clearConversationHistory,
  getConversationStats
} from "../services/conversation.service.js";

const router = Router();

router.post(
  "/mentor",
  asyncHandler(async (req, res) => {
    const { problem, plan, sessionId: clientSessionId } = req.body;

    if (!problem || typeof problem !== "string") {
      throw new ApiError(400, "Problem description is required");
    }

    if (plan === undefined || typeof plan !== "string") {
      throw new ApiError(400, "Plan is required");
    }

    // Get or create session ID
    const sessionId = getOrCreateSessionId(clientSessionId);
    const isNewSession = !clientSessionId || clientSessionId !== sessionId;

    // Get conversation history from Redis
    const history = await getConversationHistory(sessionId);
    
    // Always save full context for history (problem is needed for understanding continuity)
    const fullUserMessage = `Problem:\n${problem}\n\nStudent's Plan:\n${plan}`;
    
    // Add user message to history BEFORE getting Gemini history
    await addMessageToHistory(sessionId, 'user', fullUserMessage);
    
    // Get updated history and format for Gemini (will be pruned if too long)
    const updatedHistory = await getConversationHistory(sessionId);
    const geminiHistory = formatHistoryForGemini(updatedHistory.slice(0, -1)); // Exclude the message we just added
    
    // Log stats for monitoring
    if (process.env.NODE_ENV === 'development') {
      const stats = getConversationStats(updatedHistory);
      console.log(`[Session ${sessionId.substring(0, 8)}] History messages: ${stats.messageCount}, Est. Tokens: ${stats.estimatedTokens}`);
      console.log(`[Session ${sessionId.substring(0, 8)}] Gemini history length: ${geminiHistory.length}`);
    }

    // Set response headers before streaming
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Use streaming for real-time response
    try {
      // Send session ID if new session (before starting the AI stream)
      if (isNewSession) {
        res.write(JSON.stringify({
          type: 'session',
          sessionId
        }) + '\n');
      }

      const result = await evaluatePlan(problem, plan, res, geminiHistory);
      
      // Save assistant's response to history
      if (result && result.message) {
        await addMessageToHistory(sessionId, 'assistant', result.message);
      }
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

// Clear conversation history
router.delete(
  "/conversation/:sessionId",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ApiError(400, "Session ID is required");
    }

    await clearConversationHistory(sessionId);
    return res.status(200).json(new ApiResponse(200, null, "Conversation history cleared"));
  })
);

// Get conversation stats (for monitoring/debugging)
router.get(
  "/conversation/:sessionId/stats",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ApiError(400, "Session ID is required");
    }

    const history = await getConversationHistory(sessionId);
    const stats = getConversationStats(history);
    
    return res.status(200).json(new ApiResponse(200, {
      sessionId,
      messageCount: stats.messageCount,
      estimatedTokens: stats.estimatedTokens,
      messages: history.map(m => ({
        role: m.role,
        length: m.content.length,
        timestamp: m.timestamp
      }))
    }, "Conversation stats retrieved"));
  })
);

router.post(
  "/guided-thinking",
  asyncHandler(async (req, res) => {
    const { problem, conversation } = req.body;

    if (!problem || typeof problem !== "string") {
      throw new ApiError(400, "Problem description is required");
    }

    if (!Array.isArray(conversation)) {
      throw new ApiError(400, "Conversation must be an array");
    }

    const convo = conversation.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'mentor',
      text: msg.text || msg.content || ''
    }));

    const result = await guidedThinking(problem, convo);
    
    return res.status(200).json(new ApiResponse(200, result, "Guided thinking response generated"));
  })
);

export default router;
