import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const systemPrompt = fs.readFileSync(
  path.join(__dirname, '../prompts/thinkFirstMentorAI-system-prompt.txt'),
  'utf-8'
);

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const GEMINI_BASE_URL = 'https://aiplatform.googleapis.com/v1/publishers/google/models';

export async function evaluatePlan(problem, plan, res = null, conversationHistory = []) {
  try {
    const isStreaming = res !== null;
    
    // Build conversation contents with history
    const contents = [...conversationHistory];
    
    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI Service] Incoming history length: ${conversationHistory.length}`);
      if (conversationHistory.length > 0) {
        console.log(`[AI Service] Last message in history: ${conversationHistory[conversationHistory.length - 1].role}`);
      }
    }
    
    // Add current user message (note: history already includes full context)
    contents.push({
      role: 'user',
      parts: [
        {
          text: `Problem:\n${problem}\n\nStudent's Plan:\n${plan}`
        }
      ]
    });
    
    // Build Gemini request payload
    const requestPayload = {
      contents,
      systemInstruction: {
        parts: [
          {
            text: systemPrompt
          }
        ]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
        topP: 0.95,
        topK: 40
      }
    };

    if (isStreaming) {
      return await streamResponse(requestPayload, res);
    } else {
      return await getNonStreamResponse(requestPayload);
    }
  } catch (error) {
    console.error('AI Service Error:', error.message);
    return {
      readyToCode: false,
      message: "Try rephrasing your approach in simple words."
    };
  }
}

async function getNonStreamResponse(requestPayload) {
  try {
    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(
      url,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout for Gemini API
      }
    );

    // Extract text from Gemini response
    const candidate = response.data.candidates?.[0];
    const aiMessage = candidate?.content?.parts?.[0]?.text || '';
    
    const readySignals = [
      'ready to try coding',
      'ready to code',
      'you can now try coding',
      'you can try coding now'
    ];
    const readyToCode = readySignals.some(signal =>
      aiMessage.toLowerCase().includes(signal)
    );

    return {
      readyToCode,
      message: aiMessage
    };
  } catch (error) {
    console.error('Non-stream API Error:', error.message);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    }
    throw error;
  }
}

async function streamResponse(requestPayload, res) {
  try {
    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;
    
    const response = await axios.post(
      url,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 30000 // 30 second timeout for Gemini API
      }
    );

    let fullMessage = '';
    let buffer = '';
    const readySignals = [
      'ready to try coding',
      'ready to code',
      'you can now try coding',
      'you can try coding now'
    ];

    // Don't set headers here - they should be set in the route before calling this function

    return new Promise((resolve, reject) => {
      // Add timeout safety net
      const timeout = setTimeout(() => {
        console.warn('Stream timeout after 30s');
        const readyToCode = readySignals.some(signal =>
          fullMessage.toLowerCase().includes(signal)
        );
        res.write(JSON.stringify({
          type: 'complete',
          readyToCode,
          fullMessage
        }) + '\n');
        res.end();
        resolve({
          readyToCode,
          message: fullMessage
        });
      }, 30000);

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // Split by newline to process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          
          if (!line || line.startsWith(':')) continue; // Skip empty lines and comments
          
          // Parse SSE format: "data: {...}"
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6); // Remove "data: " prefix
            
            try {
              const data = JSON.parse(jsonStr);
              
              // Extract text from Gemini response
              const candidate = data.candidates?.[0];
              const textPart = candidate?.content?.parts?.[0]?.text;
              
              if (textPart) {
                fullMessage += textPart;
                
                // Send chunk to client in real-time
                res.write(JSON.stringify({
                  type: 'chunk',
                  content: textPart
                }) + '\n');
              }
              
              // Check if this is the final chunk
              const finishReason = candidate?.finishReason;
              if (finishReason && finishReason !== 'STOP') {
                console.warn('Stream finished with reason:', finishReason);
              }
              
            } catch (error) {
              console.debug('Skipped malformed SSE data:', error.message);
            }
          }
        }
      });

      response.data.on('error', (error) => {
        clearTimeout(timeout);
        console.error('Stream error:', error.message);
        if (!res.headersSent) {
          reject(error);
        }
      });

      response.data.on('end', () => {
        clearTimeout(timeout);
        
        // Always complete the stream
        const readyToCode = readySignals.some(signal =>
          fullMessage.toLowerCase().includes(signal)
        );
        
        res.write(JSON.stringify({
          type: 'complete',
          readyToCode,
          fullMessage
        }) + '\n');
        res.end();
        
        resolve({
          readyToCode,
          message: fullMessage
        });
      });
    });
  } catch (error) {
    console.error('Streaming API Error:', error.message);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    }
    throw error;
  }
}
