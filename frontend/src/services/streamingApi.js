/**
 * Frontend utility for consuming streaming API responses
 * 
 * Example usage:
 * const stream = await streamMentorFeedback(problem, plan);
 * 
 * for await (const chunk of stream) {
 *   if (chunk.type === 'chunk') {
 *     // Update UI with partial content in real-time
 *     displayPartialMessage(chunk.content);
 *   } else if (chunk.type === 'complete') {
 *     // Handle completion
 *     console.log('Ready to code:', chunk.readyToCode);
 *     displayFinalMessage(chunk.fullMessage);
 *   }
 * }
 */

export async function* streamMentorFeedback(problem, plan) {
  try {
    const response = await fetch('/api/v1/ai/mentor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ problem, plan })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          if (lines[i].trim()) {
            try {
              const chunk = JSON.parse(lines[i]);
              yield chunk;
            } catch (error) {
              console.error('Error parsing JSON chunk:', error);
            }
          }
        }

        // Keep the incomplete line in the buffer
        buffer = lines[lines.length - 1];
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer);
          yield chunk;
        } catch (error) {
          console.error('Error parsing final JSON chunk:', error);
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Stream error:', error);
    throw error;
  }
}

/**
 * Alternative: Non-streaming approach (for backward compatibility)
 * This maintains the original behavior when needed
 */
export async function getMentorFeedback(problem, plan) {
  try {
    const response = await fetch('/api/v1/ai/mentor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ problem, plan })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching mentor feedback:', error);
    throw error;
  }
}
