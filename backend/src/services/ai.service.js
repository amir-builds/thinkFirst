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

export async function evaluatePlan(problem, plan) {
  try {
    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}`,
      {
        model: process.env.DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Problem:\n${problem}\n\nStudent's Plan:\n${plan}`
          }
        ],
        temperature: 0.2,
        max_tokens: 120
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiMessage = response.data.choices[0].message.content;
    
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
    return {
      readyToCode: false,
      message: "Try rephrasing your approach in simple words."
    };
  }
}
