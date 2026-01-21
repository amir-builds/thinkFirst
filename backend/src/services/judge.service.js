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
  const url = `${baseUrl}/submissions?base64_encoded=false&wait=true`;

  const payload = {
    source_code: code,
    language_id: langId,
    stdin: input,
    cpu_time_limit: 5,
    memory_limit: 128000
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });
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
