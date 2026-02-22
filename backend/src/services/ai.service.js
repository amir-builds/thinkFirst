import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const systemPrompt = fs.readFileSync(
  path.join(__dirname, '../prompts/thinkFirstMentorAI-system-prompt.txt'),
  'utf-8'
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

export async function evaluatePlan(problem, plan, res = null) {
  try {
    const isStreaming = res !== null;
    const userMessage = `Problem:\n${problem}\n\nStudent's Plan:\n${plan}`;

    if (isStreaming) {
      return await streamResponse(userMessage, res);
    } else {
      return await getNonStreamResponse(userMessage);
    }
  } catch (error) {
    console.error('AI Service Error:', error.message);
    return {
      readyToCode: false,
      message: "Try rephrasing your approach in simple words."
    };
  }
}

async function getNonStreamResponse(userMessage) {
  try {
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 800
      }
    });

    const aiMessage = response.response.text();
    
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
    throw error;
  }
}

async function streamResponse(userMessage, res) {
  try {
    const stream = await model.generateContentStream({
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 800
      }
    });

    let fullMessage = '';
    const readySignals = [
      'ready to try coding',
      'ready to code',
      'you can now try coding',
      'you can try coding now'
    ];

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    return new Promise(async (resolve, reject) => {
      try {
        // Get the response from the stream
        const response = await stream.response;
        
        // Extract text from the response
        const text = response.text();
        fullMessage = text;

        // Send chunks (for now send whole response)
        if (text) {
          res.write(JSON.stringify({
            type: 'chunk',
            content: text
          }) + '\n');
        }

        // Stream complete
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
      } catch (error) {
        console.error('Stream processing error:', error.message);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Streaming API Error:', error.message);
    throw error;
  }
}
