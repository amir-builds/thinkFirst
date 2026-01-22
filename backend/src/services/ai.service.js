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

export async function evaluatePlan(problem, plan, res = null) {
  try {
    const isStreaming = res !== null;
    const requestPayload = {
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
      max_tokens: 120,
      stream: isStreaming
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
    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}`,
      requestPayload,
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
    console.error('Non-stream API Error:', error.message);
    throw error;
  }
}

async function streamResponse(requestPayload, res) {
  try {
    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}`,
      requestPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
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

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        // Append chunk to buffer
        buffer += chunk.toString();
        
        // Split by newline and process complete lines
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines[lines.length - 1];
        
        // Process all complete lines (all but the last one)
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          
          if (!line) continue; // Skip empty lines
          
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              
              if (jsonStr === '[DONE]') {
                // Stream complete
                const readyToCode = readySignals.some(signal =>
                  fullMessage.toLowerCase().includes(signal)
                );
                
                res.write(JSON.stringify({
                  type: 'complete',
                  readyToCode,
                  fullMessage
                }) + '\n');
                resolve({
                  readyToCode,
                  message: fullMessage
                });
                return;
              }

              // Only try to parse if it looks like JSON
              if (jsonStr.startsWith('{')) {
                const data = JSON.parse(jsonStr);
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  const content = data.choices[0].delta.content;
                  fullMessage += content;

                  // Send chunk to client in real-time
                  res.write(JSON.stringify({
                    type: 'chunk',
                    content
                  }) + '\n');
                }
              }
            } catch (error) {
              // Silently skip malformed chunks
              console.debug('Skipped malformed chunk:', error.message);
            }
          }
        }
      });

      response.data.on('error', (error) => {
        console.error('Stream error:', error.message);
        reject(error);
      });

      response.data.on('end', () => {
        // Process any remaining data in buffer
        if (buffer.trim()) {
          const line = buffer.trim();
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                const readyToCode = readySignals.some(signal =>
                  fullMessage.toLowerCase().includes(signal)
                );
                res.write(JSON.stringify({
                  type: 'complete',
                  readyToCode,
                  fullMessage
                }) + '\n');
              } else if (jsonStr.startsWith('{')) {
                const data = JSON.parse(jsonStr);
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  fullMessage += data.choices[0].delta.content;
                  res.write(JSON.stringify({
                    type: 'chunk',
                    content: data.choices[0].delta.content
                  }) + '\n');
                }
              }
            } catch (error) {
              console.debug('Skipped final malformed chunk');
            }
          }
        }
        res.end();
      });
    });
  } catch (error) {
    console.error('Streaming API Error:', error.message);
    throw error;
  }
}
