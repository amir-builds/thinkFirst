/**
 * Utility for handling streaming responses from the API
 */

export function parseStreamChunk(chunk) {
  try {
    return JSON.parse(chunk);
  } catch (error) {
    console.error('Error parsing stream chunk:', error);
    return null;
  }
}

export function isStreamComplete(parsedChunk) {
  return parsedChunk && parsedChunk.type === 'complete';
}

export function getStreamContent(parsedChunk) {
  return parsedChunk && parsedChunk.type === 'chunk' ? parsedChunk.content : '';
}
