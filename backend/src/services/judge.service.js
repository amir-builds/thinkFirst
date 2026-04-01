import axios from "axios";

const LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50
};

export async function runJudge0(code, language, input = "") {
  const langId = LANGUAGE_IDS[language.toLowerCase()];
  if (!langId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const baseUrl = process.env.JUDGE0_URL || "http://localhost:2358";
  // Use base64 encoding to handle special characters in code (especially C++ #include)
  const url = `${baseUrl}/submissions?base64_encoded=true&wait=true`;

  // Convert code and input to base64
  const sourceCodeBase64 = Buffer.from(code).toString('base64');
  const stdinBase64 = Buffer.from(input).toString('base64');

  const payload = {
    source_code: sourceCodeBase64,
    language_id: langId,
    stdin: stdinBase64,
    cpu_time_limit: 5,
    memory_limit: 128000
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });
    console.log("[JUDGE0 RESPONSE]", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      throw new Error("Judge0 server is not running. Please start it with: docker-compose -f docker-compose.judge0.yml up -d");
    }
    throw new Error(`Judge0 API error: ${error.message}`);
  }
}

export function getSupportedLanguages() {
  return Object.keys(LANGUAGE_IDS);
}
