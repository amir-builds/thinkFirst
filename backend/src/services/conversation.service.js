import { randomUUID } from 'crypto';
import redisClient from '../utils/redisClient.js';

const SESSION_TTL = 1800; // 30 minutes
const SESSION_PREFIX = 'session:';
const MAX_HISTORY_MESSAGES = 12; // Keep last 6 exchanges (12 messages)
const MAX_TOKENS_ESTIMATE = 3000; // Rough token limit for conversation history

/**
 * Estimate tokens (rough: 1 token ≈ 4 characters)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Get or create a session ID
 */
export function getOrCreateSessionId(sessionId) {
  return sessionId && sessionId.trim() !== '' ? sessionId : randomUUID();
}

/**
 * Get conversation history from Redis
 */
export async function getConversationHistory(sessionId) {
  try {
    const key = `${SESSION_PREFIX}${sessionId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Redis get error:', error.message);
    return [];
  }
}

/**
 * Save conversation history to Redis
 */
export async function saveConversationHistory(sessionId, messages) {
  try {
    const key = `${SESSION_PREFIX}${sessionId}`;
    await redisClient.setEx(key, SESSION_TTL, JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Redis save error:', error.message);
    return false;
  }
}

/**
 * Add message to conversation history with smart pruning
 */
export async function addMessageToHistory(sessionId, role, content) {
  let history = await getConversationHistory(sessionId);
  const beforeLength = history.length;
  
  // Add new message
  history.push({ role, content, timestamp: Date.now() });
  
  // Smart pruning: Keep first message (problem context) + recent messages
  if (history.length > MAX_HISTORY_MESSAGES) {
    const firstMessage = history[0]; // Always keep the initial problem
    const recentMessages = history.slice(-MAX_HISTORY_MESSAGES + 1);
    history = [firstMessage, ...recentMessages];
  }
  
  // Token-based pruning: If estimated tokens exceed limit, keep fewer messages
  let totalTokens = history.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  
  while (totalTokens > MAX_TOKENS_ESTIMATE && history.length > 2) {
    // Remove second message (keep first and most recent)
    history.splice(1, 1);
    totalTokens = history.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  }
  
  await saveConversationHistory(sessionId, history);
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ConversationService] ${sessionId.substring(0, 8)} - Added ${role}: ${beforeLength} → ${history.length} messages, ~${totalTokens} tokens`);
  }
  
  return history;
}

/**
 * Clear conversation history
 */
export async function clearConversationHistory(sessionId) {
  try {
    const key = `${SESSION_PREFIX}${sessionId}`;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error.message);
    return false;
  }
}

/**
 * Get conversation history formatted for Gemini API (optimized)
 */
export function formatHistoryForGemini(history) {
  if (history.length === 0) return [];
  
  return history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

/**
 * Get conversation stats for monitoring
 */
export function getConversationStats(history) {
  const messageCount = history.length;
  const totalTokens = history.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  return { messageCount, estimatedTokens: totalTokens };
}
