import { runJudge0, getSupportedLanguages } from "../services/judge.service.js";
import { compareOutput } from "../utils/compare.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Wrap student code with input/output boilerplate
 * This allows students to just write the function without worrying about stdin/stdout
 */
function wrapCodeWithBoilerplate(code, language, input) {
  const lang = language.toLowerCase();
  
  // Detect the main function name from the code
  let funcName = null;
  
  if (lang === 'python') {
    // Match: def function_name(
    const match = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (match) funcName = match[1];
  } else if (lang === 'javascript') {
    // Match: function functionName( or const functionName = 
    const match = code.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/) ||
                  code.match(/(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:\(|function)/);
    if (match) funcName = match[1];
  } else if (lang === 'java') {
    // Match: public static ... methodName(
    const match = code.match(/public\s+static\s+\w+\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (match) funcName = match[1];
  } else if (lang === 'cpp' || lang === 'c') {
    // Match: returnType functionName(
    const match = code.match(/(?:int|void|string|bool|double|float|long|char|vector<[^>]+>)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (match && match[1] !== 'main') funcName = match[1];
  }

  // If no function detected or code already has main/input handling, return as-is
  if (!funcName) return code;
  
  // Check if code already handles input (comprehensive detection)
  const hasInputHandling = 
    (lang === 'python' && (
      /\binput\s*\(/.test(code) || 
      /sys\.stdin/.test(code) || 
      /fileinput/.test(code) ||
      /open\s*\(/.test(code) ||
      /\.read\s*\(/.test(code) ||
      /\.readline/.test(code)
    )) ||
    (lang === 'javascript' && (
      /require\s*\(\s*['"]fs['"]\s*\)/.test(code) || 
      /process\.stdin/.test(code) || 
      /readline/.test(code) ||
      /prompt\s*\(/.test(code)
    )) ||
    (lang === 'java' && /Scanner|BufferedReader|System\.in/.test(code)) ||
    ((lang === 'cpp' || lang === 'c') && /\bcin\b|\bscanf\b|\bgetline\b|\bfgets\b/.test(code));
  
  // Also check if code has print/output statements (likely a complete solution)
  const hasOutputHandling =
    (lang === 'python' && /\bprint\s*\(/.test(code)) ||
    (lang === 'javascript' && /console\.log\s*\(/.test(code)) ||
    (lang === 'java' && /System\.out\.print/.test(code)) ||
    ((lang === 'cpp' || lang === 'c') && /\bcout\b|\bprintf\b/.test(code));

  // If code has both input AND output handling, it's a complete solution - don't wrap
  if (hasInputHandling && hasOutputHandling) return code;
  
  // If code only has output handling but no input, still don't wrap (user handles it their way)
  if (hasInputHandling) return code;

  // Wrap code based on language
  switch (lang) {
    case 'python':
      return `${code}

# Auto-generated input handling
import ast
import json
import sys
try:
    _input = input().strip()
    
    # Try to parse comma-separated arguments (e.g., "[2,7,11,15], 9")
    # First, try to evaluate the entire input
    try:
        _args = ast.literal_eval(_input)
        if isinstance(_args, tuple):
            result = ${funcName}(*_args)
        else:
            result = ${funcName}(_args)
    except:
        # If that fails, try splitting by comma at top level
        # Handle cases like "[2,7,11,15], 9"
        if '],' in _input or '},'.join(_input):
            # Find the split point (after ] or })
            split_idx = max(_input.find('],'), _input.find('},'))
            if split_idx > 0:
                first_arg = ast.literal_eval(_input[:split_idx+1])
                remaining = _input[split_idx+2:].strip()
                other_args = [ast.literal_eval(x.strip()) for x in remaining.split(',') if x.strip()]
                result = ${funcName}(first_arg, *other_args)
            else:
                result = ${funcName}(_input)
        else:
            result = ${funcName}(_input)
    
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
`;

    case 'javascript':
      return `${code}

// Auto-generated input handling
const fs = require('fs');
const _input = fs.readFileSync(0, 'utf8').trim();
try {
    // Handle multiple arguments separated by comma (e.g., "[2,7,11,15], 9")
    const _parts = _input.split(',').map(s => s.trim());
    
    // Try to parse as multiple JSON arguments
    if (_parts.length > 1) {
        // Check if first part looks like an array/object
        const firstArgEnd = _input.indexOf(']') !== -1 ? _input.indexOf(']') + 1 : _input.indexOf('}') + 1;
        if (firstArgEnd > 0) {
            const firstArg = JSON.parse(_input.substring(0, firstArgEnd));
            const remainingArgs = _input.substring(firstArgEnd + 1).trim().split(/,\\s*/).filter(s => s).map(s => {
                try { return JSON.parse(s); } catch(e) { return s; }
            });
            const result = ${funcName}(firstArg, ...remainingArgs);
            console.log(JSON.stringify(result));
        } else {
            // Simple comma-separated values
            const _args = _parts.map(p => { try { return JSON.parse(p); } catch(e) { return p; } });
            const result = ${funcName}(..._args);
            console.log(JSON.stringify(result));
        }
    } else {
        // Single argument
        const _args = JSON.parse(_input);
        const result = ${funcName}(_args);
        console.log(JSON.stringify(result));
    }
} catch(e) {
    console.error('Error in boilerplate:', e.message);
    console.log(JSON.stringify(${funcName}(_input)));
}
`;

    case 'java':
      // For Java, we need to wrap in a class if not present
      if (!code.includes('class ')) {
        return `import java.util.*;
import java.util.stream.*;

public class Main {
    ${code}
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine().trim();
        // Parse input as array
        if (line.startsWith("[")) {
            line = line.substring(1, line.length() - 1);
            int[] arr = Arrays.stream(line.split(",\\\\s*"))
                .mapToInt(Integer::parseInt).toArray();
            System.out.println(${funcName}(arr));
        } else {
            System.out.println(${funcName}(Integer.parseInt(line)));
        }
    }
}`;
      }
      return code;

    case 'cpp':
      // Check if main exists
      if (!/\bmain\s*\(/.test(code)) {
        return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
using namespace std;

${code}

int main() {
    string line;
    getline(cin, line);
    
    // Parse array input like [1, 2, 3]
    if (line[0] == '[') {
        vector<int> arr;
        line = line.substr(1, line.size() - 2);
        stringstream ss(line);
        string item;
        while (getline(ss, item, ',')) {
            arr.push_back(stoi(item));
        }
        cout << ${funcName}(arr) << endl;
    } else {
        cout << ${funcName}(stoi(line)) << endl;
    }
    return 0;
}`;
      }
      return code;

    case 'c':
      // C is more complex, return as-is for now
      return code;

    default:
      return code;
  }
}

export const executeCode = asyncHandler(async (req, res) => {
  const { question, code, language } = req.body;

  if (!code || !language) {
    throw new ApiError(400, "Code and language are required");
  }

  const supportedLanguages = getSupportedLanguages();
  if (!supportedLanguages.includes(language.toLowerCase())) {
    throw new ApiError(400, `Unsupported language: ${language}`);
  }

  // Collect all test cases from question object
  const testCases = [];
  const expectedOutputs = [];

  // Helper function to normalize input format
  const normalizeInput = (input) => {
    if (!input) return '';
    let str = String(input).trim();
    
    // Replace common patterns to convert to newlines
    // Pattern: "variable = value variable2 = value2" -> "variable = value\nvariable2 = value2"
    // Look for patterns like "] variable" or "number variable" and add newline
    str = str.replace(/\]\s+([a-zA-Z_])/g, ']\n$1');  // "] target" -> "]\ntarget"
    str = str.replace(/(\d)\s+([a-zA-Z_]\w*\s*=)/g, '$1\n$2');  // "9 nums" -> "9\nnums"
    
    return str;
  };

  // First, check if question.testCases array exists and use it
  if (question && question.testCases && Array.isArray(question.testCases)) {
    question.testCases.forEach(tc => {
      if (!tc || typeof tc !== 'object') return;

      let input = tc.input || tc.sample_input1 || tc.sampleInput || '';
      if (typeof input === 'string' && input.startsWith('"') && input.endsWith('"')) {
        input = input.slice(1, -1);
      }
      testCases.push(normalizeInput(input));

      let expected = tc.output || tc.expectedOutput || tc.sample_output1 || tc.sampleOutput || '';
      if (typeof expected === 'string' && expected.startsWith('"') && expected.endsWith('"')) {
        expected = expected.slice(1, -1);
      }
      expectedOutputs.push(expected);
    });
  } else if (question) {
    // Fallback to sample_input1, sample_output1, etc. up to 3
    for (let i = 1; i <= 3; i++) {
      const input = question[`sample_input${i}`];
      const output = question[`sample_output${i}`];
      if (input !== undefined && input !== null && output !== undefined && output !== null) {
        testCases.push(normalizeInput(String(input)));
        expectedOutputs.push(String(output));
      }
    }
  }

  // If no test cases found, use a default empty one
  if (testCases.length === 0) {
    testCases.push('');
    expectedOutputs.push('');
  }

  // Run code against all test cases using Judge0
  const results = [];
  let totalTime = 0;
  let totalMemory = 0;

  for (let i = 0; i < testCases.length; i++) {
    const input = testCases[i];
    const expected = expectedOutputs[i];

    try {
      // Wrap student code with input/output boilerplate
      const wrappedCode = wrapCodeWithBoilerplate(code, language, input);
      const judgeResult = await runJudge0(wrappedCode, language, input);

      const stdout = (judgeResult.stdout || '').replace(/\x00/g, '').trim();
      const stderr = judgeResult.stderr || '';
      const compileOutput = judgeResult.compile_output || '';
      const status = judgeResult.status?.description || 'Unknown';

      // Check if execution was successful and output matches
      const isAccepted = judgeResult.status?.id === 3; // Status ID 3 = Accepted
      const outputMatches = compareOutput(expected, stdout);
      const pass = isAccepted && outputMatches;

      let explanation = '';
      if (!pass) {
        if (!isAccepted) {
          // Compilation error, runtime error, TLE, etc.
          explanation = compileOutput || stderr || status;
        } else {
          // Wrong answer
          explanation = `Expected: "${expected}", Got: "${stdout}"`;
        }
      }

      results.push({
        pass,
        expected,
        output: stdout,
        status,
        explanation,
        stderr: stderr || undefined,
        compile_output: compileOutput || undefined,
        time: judgeResult.time,
        memory: judgeResult.memory
      });

      totalTime += parseFloat(judgeResult.time || 0);
      totalMemory = Math.max(totalMemory, parseFloat(judgeResult.memory || 0));

    } catch (err) {
      results.push({
        pass: false,
        expected,
        output: '',
        status: 'Error',
        explanation: err.message,
      });
    }
  }

  res.json(new ApiResponse(200, {
    results,
    time: totalTime.toFixed(3),
    memory: totalMemory
  }));
});

export const getSupportedLanguagesController = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, { languages: getSupportedLanguages() }));
});
