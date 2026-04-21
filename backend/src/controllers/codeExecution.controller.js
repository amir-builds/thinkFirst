import { runJudge0, getSupportedLanguages } from "../services/judge.service.js";
import { compareOutput } from "../utils/compare.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Wrap student code with input/output boilerplate
 * This allows students to just write the function without worrying about stdin/stdout
 */
/**
 * Extract a specific function from code by name
 * Handles nested braces correctly
 */
function extractFunctionByName(code, funcName) {
  // Escape special regex characters in function name
  const escapedFuncName = funcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Look for the function signature - match common return types before the function name
  // Handles: bool, boolean, int, int[], int[][], String, void, vector<...>, List<...>, etc.
  const funcRegex = new RegExp(
    `(?:public\\s+|private\\s+|protected\\s+|static\\s+)*(bool|boolean|string|String|int(?:\\[\\])*|void|double|float|long|char|auto|unsigned\\s+\\w+|vector<[^>]+>|List<[^>]+>)\\s+${escapedFuncName}\\s*\\([^)]*\\)\\s*\\{`
  );
  
  const match = code.match(funcRegex);
  if (!match) {
    console.log(`[DEBUG] Could not find function ${funcName}`);
    return null;
  }
  
  console.log(`[DEBUG] Found function ${funcName} at index ${match.index}`);
  
  // Find the start of the function body (position of opening brace)
  const startIdx = match.index + match[0].length - 1; // Position of opening brace
  let braceCount = 1;
  let endIdx = startIdx + 1;
  
  // Find matching closing brace — skip braces inside string/char literals
  let inString = false;
  let inChar = false;
  while (endIdx < code.length && braceCount > 0) {
    const ch = code[endIdx];
    const prev = endIdx > 0 ? code[endIdx - 1] : '';
    
    if (inString) {
      if (ch === '"' && prev !== '\\') inString = false;
    } else if (inChar) {
      if (ch === "'" && prev !== '\\') inChar = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === "'") inChar = true;
      else if (ch === '{') braceCount++;
      else if (ch === '}') braceCount--;
    }
    endIdx++;
  }
  
  // Extract function from beginning of line to closing brace
  const lineStart = code.lastIndexOf('\n', match.index);
  const funcStart = lineStart === -1 ? 0 : lineStart + 1;
  const extracted = code.substring(funcStart, endIdx).trim();
  
  console.log(`[DEBUG] Extracted function (length: ${extracted.length})`);
  return extracted;
}

function wrapCodeWithBoilerplate(code, language, input) {
  const lang = language.toLowerCase();
  
  // Detect the main function name from the code
  let funcName = null;
  const excludedNames = ['if', 'for', 'while', 'switch', 'catch', 'main', 'class', 'struct', 'return', 'new', 'else'];
  
  if (lang === 'python') {
    const match = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (match) funcName = match[1];
  } else if (lang === 'javascript') {
    const match = code.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/) ||
                  code.match(/(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:\(|function)/);
    if (match) funcName = match[1];
  } else if (lang === 'java' || lang === 'cpp' || lang === 'c') {
    // Generic: find funcName(params) { — works for any return type
    const match = code.match(/\b([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{/);
    if (match && !excludedNames.includes(match[1])) funcName = match[1];
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
  
  // If code has input handling (even without output), user handles it their way - don't wrap
  if (hasInputHandling) return code;

  // For Python/JavaScript: if code has output handling (print/console.log), it's a standalone script - don't wrap
  // For Java/C++/C: DON'T skip wrapping here — the language-specific logic below
  // extracts the function from full classes/programs and rewraps with proper stdin/stdout
  if ((lang === 'python' || lang === 'javascript') && hasOutputHandling) return code;

  // Wrap code based on language
  switch (lang) {
    case 'python':
      return `${code}

# Auto-generated input handling
import ast
import json
import sys
try:
    _all_input = sys.stdin.read().strip()
    _lines = _all_input.split('\\n')
    
    if len(_lines) > 1:
        # Multiple lines = multiple arguments (one per line)
        _args = []
        for _l in _lines:
            _l = _l.strip()
            if not _l:
                continue
            try:
                _args.append(ast.literal_eval(_l))
            except:
                _args.append(_l)
        result = ${funcName}(*_args)
    else:
        _input = _lines[0].strip()
        try:
            _parsed = ast.literal_eval(_input)
            if isinstance(_parsed, tuple):
                result = ${funcName}(*_parsed)
            else:
                result = ${funcName}(_parsed)
        except:
            result = ${funcName}(_input)
    
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
`;

    case 'javascript':
      return `${code}

// Auto-generated input handling
const fs = require('fs');
const _allInput = fs.readFileSync(0, 'utf8').trim();
const _lines = _allInput.split('\\n').map(s => s.trim()).filter(s => s);
try {
    if (_lines.length > 1) {
        // Multiple lines = multiple arguments (from normalizeInput splitting)
        const _args = _lines.map(l => { try { return JSON.parse(l); } catch(e) { return l; } });
        const result = ${funcName}(..._args);
        console.log(JSON.stringify(result));
    } else {
        // Single line — could be one arg or multiple comma-separated top-level args
        const _input = _lines[0];
        // Split at top-level commas (outside brackets/braces/quotes)
        let _depth = 0, _inStr = false, _strCh = '', _topArgs = [], _cur = '';
        for (let _i = 0; _i < _input.length; _i++) {
            const _c = _input[_i];
            if (_inStr) { _cur += _c; if (_c === _strCh && _input[_i-1] !== '\\\\') _inStr = false; }
            else if (_c === '"' || _c === "'") { _inStr = true; _strCh = _c; _cur += _c; }
            else if (_c === '[' || _c === '(' || _c === '{') { _depth++; _cur += _c; }
            else if (_c === ']' || _c === ')' || _c === '}') { _depth--; _cur += _c; }
            else if (_c === ',' && _depth === 0) { _topArgs.push(_cur.trim()); _cur = ''; }
            else { _cur += _c; }
        }
        if (_cur.trim()) _topArgs.push(_cur.trim());
        
        const _parsedArgs = _topArgs.map(a => { try { return JSON.parse(a); } catch(e) { return a; } });
        const result = ${funcName}(..._parsedArgs);
        console.log(JSON.stringify(result));
    }
} catch(e) {
    console.error('Error in boilerplate:', e.message);
    // Last resort: pass raw input as string
    const result = ${funcName}(_allInput);
    console.log(JSON.stringify(result));
}
`;

    case 'java': {
      // Helper to strip modifiers (public/private/protected/static) from a function signature
      // and return just the return type
      const stripJavaModifiers = (rawReturn) => {
        return rawReturn.replace(/\b(public|private|protected|static)\b\s*/g, '').trim();
      };

      // For the sig match, use the function code (not full class).
      // If user submitted a full class, we'll re-parse after extraction.
      // For now, find the target function's signature in the code.
      const javaSigRegex = new RegExp(
        `((?:public\\s+|private\\s+|protected\\s+|static\\s+)*[\\w<>\\[\\]\\s,?]+?)\\s+${funcName}\\s*\\(([^)]*)\\)`
      );
      const javaSigMatch = code.match(javaSigRegex);
      const javaReturnType = javaSigMatch ? stripJavaModifiers(javaSigMatch[1]) : '';
      const javaParamStr = javaSigMatch ? javaSigMatch[2].trim() : '';
      // Split params carefully — simple comma split works for common DSA types
      const javaParamTypes = javaParamStr ? javaParamStr.split(',').map(p => p.trim()).filter(Boolean) : [];

      // Determine output formatting based on return type
      const isJavaArrayReturn = /\bint\s*\[\](?!\[\])/.test(javaReturnType) && !/\[\]\[\]/.test(javaReturnType);
      const isJava2DArrayReturn = /\bint\s*\[\]\[\]/.test(javaReturnType);
      const isJavaListReturn = /List/.test(javaReturnType);

      let javaPrintResult;
      if (isJava2DArrayReturn) {
        javaPrintResult = `
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < _result.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(java.util.Arrays.toString(_result[i]).replace(" ", ""));
        }
        sb.append("]");
        System.out.println(sb.toString());`;
      } else if (isJavaArrayReturn) {
        javaPrintResult = `System.out.println(java.util.Arrays.toString(_result).replace(" ", ""));`;
      } else if (isJavaListReturn) {
        javaPrintResult = `System.out.println(_result.toString().replace(" ", ""));`;
      } else {
        javaPrintResult = `System.out.println(_result);`;
      }

      const generateJavaArgParsing = () => {
        if (javaParamTypes.length === 0) {
          return `        var _result = ${funcName}();
        ${javaPrintResult}`;
        }

        let argDecls = [];
        let argNames = [];

        javaParamTypes.forEach((ptype, idx) => {
          const argName = `arg${idx}`;
          argNames.push(argName);
          if (/int\s*\[\]\[\]/.test(ptype)) {
            // int[][] — parse [[1,3],[2,6],[8,10]]
            argDecls.push(`        String _line${idx} = sc.nextLine().trim();
        java.util.List<int[]> _tempList${idx} = new java.util.ArrayList<>();
        int _i${idx} = 1;
        while (_i${idx} < _line${idx}.length()) {
            if (_line${idx}.charAt(_i${idx}) == '[') {
                int _j${idx} = _line${idx}.indexOf(']', _i${idx});
                String _inner${idx} = _line${idx}.substring(_i${idx} + 1, _j${idx});
                String[] _parts${idx} = _inner${idx}.split(",");
                int[] _row${idx} = new int[_parts${idx}.length];
                for (int i = 0; i < _parts${idx}.length; i++) _row${idx}[i] = Integer.parseInt(_parts${idx}[i].trim());
                _tempList${idx}.add(_row${idx});
                _i${idx} = _j${idx} + 1;
            } else _i${idx}++;
        }
        int[][] ${argName} = _tempList${idx}.toArray(new int[0][]);`);
          } else if (/int\s*\[\]/.test(ptype) || /List<Integer>/.test(ptype)) {
            argDecls.push(`        String _line${idx} = sc.nextLine().trim();
        _line${idx} = _line${idx}.replaceAll("[\\\\[\\\\]]", "");
        String[] _parts${idx} = _line${idx}.split(",");
        int[] ${argName} = new int[_parts${idx}.length];
        for (int i = 0; i < _parts${idx}.length; i++) ${argName}[i] = Integer.parseInt(_parts${idx}[i].trim());`);
          } else if (/String/.test(ptype) && !/\[\]/.test(ptype)) {
            argDecls.push(`        String ${argName} = sc.nextLine().trim();
        if (${argName}.startsWith("\\"") && ${argName}.endsWith("\\""))
            ${argName} = ${argName}.substring(1, ${argName}.length() - 1);`);
          } else if (/boolean/.test(ptype)) {
            argDecls.push(`        boolean ${argName} = Boolean.parseBoolean(sc.nextLine().trim());`);
          } else if (/double/.test(ptype)) {
            argDecls.push(`        double ${argName} = Double.parseDouble(sc.nextLine().trim());`);
          } else if (/long/.test(ptype)) {
            argDecls.push(`        long ${argName} = Long.parseLong(sc.nextLine().trim());`);
          } else if (/int/.test(ptype)) {
            argDecls.push(`        String _line${idx} = sc.nextLine().trim();
        if (_line${idx}.contains("=")) _line${idx} = _line${idx}.substring(_line${idx}.indexOf("=") + 1).trim();
        int ${argName} = Integer.parseInt(_line${idx});`);
          } else {
            argDecls.push(`        String ${argName} = sc.nextLine().trim();`);
          }
        });

        return `${argDecls.join('\n')}
        var _result = ${funcName}(${argNames.join(', ')});
        ${javaPrintResult}`;
      };

      // For Java, check if class exists
      if (!code.includes('class ')) {
        // Add static to user's function if not already present
        let wrappedCode = code;
        if (!code.includes('static ')) {
          // Add static after access modifier, or at start of function definition
          wrappedCode = wrappedCode.replace(
            /^(\s*)((?:public|private|protected)\s+)?([\w<>\[\], ?]+\s+)([a-zA-Z_]\w*\s*\()/m,
            '$1$2static $3$4'
          );
        } else {
          // Ensure existing access-modified methods are static
          wrappedCode = wrappedCode
            .replace(/public\s+(?!static)(\w)/g, 'public static $1')
            .replace(/private\s+(?!static)(\w)/g, 'private static $1');
        }
        
        return `import java.util.*;
import java.util.stream.*;

public class Main {
    ${wrappedCode}
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${generateJavaArgParsing()}
    }
}`;
      }
      
      // If class exists and there's System.out.println statements, extract the helper function
      if (funcName && /System\.out\.print/.test(code)) {
        const helperFunc = extractFunctionByName(code, funcName);
        if (helperFunc) {
          // Strip all access modifiers and 'static' — we'll add 'static' ourselves
          const cleanedFunc = helperFunc
            .replace(/^(\s*)(?:public\s+|private\s+|protected\s+|static\s+)+/, '$1')
            .trim();
          return `import java.util.*;
import java.util.stream.*;

public class Main {
    static ${cleanedFunc}
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${generateJavaArgParsing()}
    }
}`;
        }
      }
      // Fallback: rename whatever class to Main so Judge0 compiles it
      return code.replace(/\bclass\s+\w+/g, (match, offset) => {
        // Only rename the public class (first occurrence)
        return offset === code.indexOf(match) ? match.replace(/class\s+\w+/, 'class Main') : match;
      });
    }

    case 'cpp': {
      const cppIncludes = `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <stack>
#include <queue>
#include <map>
#include <unordered_map>
#include <set>
#include <unordered_set>
#include <climits>
#include <cmath>
#include <numeric>
using namespace std;`;

      // Parse function signature to determine param types and return type
      // Target the specific function name to avoid matching includes/helpers
      const cppSigRegex = new RegExp(
        `([\\w<>\\s,&*]+?)\\s+${funcName}\\s*\\(([^)]*)\\)`
      );
      const sigMatch = code.match(cppSigRegex);
      const returnType = sigMatch ? sigMatch[1].trim() : '';
      const paramStr = sigMatch ? sigMatch[2].trim() : '';
      
      // Determine how to print the result based on return type
      const isBoolReturn = /\bbool\b/.test(returnType);
      const isNestedVectorReturn = /vector\s*<\s*vector/.test(returnType);
      const isVectorReturn = /vector/.test(returnType) && !isNestedVectorReturn;
      const isStringReturn = /\bstring\b/.test(returnType);
      
      let printResult;
      if (isBoolReturn) {
        printResult = `cout << boolalpha << result << endl;`;
      } else if (isNestedVectorReturn) {
        printResult = `cout << "[";
        for (int i = 0; i < (int)result.size(); i++) {
            if (i > 0) cout << ",";
            cout << "[";
            for (int j = 0; j < (int)result[i].size(); j++) {
                if (j > 0) cout << ",";
                cout << result[i][j];
            }
            cout << "]";
        }
        cout << "]" << endl;`;
      } else if (isVectorReturn) {
        printResult = `cout << "[";
        for (int i = 0; i < (int)result.size(); i++) {
            if (i > 0) cout << ",";
            cout << result[i];
        }
        cout << "]" << endl;`;
      } else if (isStringReturn) {
        printResult = `cout << result << endl;`;
      } else {
        printResult = `cout << result << endl;`;
      }

      // Parse parameter types to generate correct argument parsing
      const paramTypes = paramStr.split(',').map(p => p.trim()).filter(Boolean);
      
      const generateMainBody = () => {
        if (paramTypes.length === 0) {
          return `    auto result = ${funcName}();
    ${printResult}`;
        }
        
        if (paramTypes.length === 1) {
          const ptype = paramTypes[0];
          if (/vector\s*<\s*vector/.test(ptype)) {
            // vector<vector<int>> - parse [[1,2],[3,4]]
            return `    string line;
    getline(cin, line);
    vector<vector<int>> arr;
    // Parse nested array like [[1,2],[3,4]]
    int i = 1; // skip first [
    while (i < (int)line.size()) {
        if (line[i] == '[') {
            vector<int> inner;
            i++;
            string num = "";
            while (i < (int)line.size() && line[i] != ']') {
                if (line[i] == ',') {
                    if (!num.empty()) inner.push_back(stoi(num));
                    num = "";
                } else if (line[i] != ' ') {
                    num += line[i];
                }
                i++;
            }
            if (!num.empty()) inner.push_back(stoi(num));
            arr.push_back(inner);
            i++; // skip ]
        } else {
            i++;
        }
    }
    auto result = ${funcName}(arr);
    ${printResult}`;
          } else if (/vector\s*<\s*int\s*>/.test(ptype)) {
            return `    string line;
    getline(cin, line);
    vector<int> arr;
    line = line.substr(1, line.size() - 2);
    stringstream ss(line);
    string item;
    while (getline(ss, item, ',')) {
        item.erase(0, item.find_first_not_of(" "));
        item.erase(item.find_last_not_of(" ") + 1);
        if (!item.empty()) arr.push_back(stoi(item));
    }
    auto result = ${funcName}(arr);
    ${printResult}`;
          } else if (/vector\s*<\s*string\s*>/.test(ptype)) {
            return `    string line;
    getline(cin, line);
    vector<string> arr;
    // Simple parse of ["a","b","c"]
    stringstream ss(line.substr(1, line.size() - 2));
    string item;
    while (getline(ss, item, ',')) {
        item.erase(0, item.find_first_not_of(" \\""));
        item.erase(item.find_last_not_of(" \\"") + 1);
        if (!item.empty()) arr.push_back(item);
    }
    auto result = ${funcName}(arr);
    ${printResult}`;
          } else if (/\bstring\b/.test(ptype)) {
            return `    string line;
    getline(cin, line);
    // Remove surrounding quotes if present
    if (line.size() >= 2 && line[0] == '"' && line[line.size()-1] == '"')
        line = line.substr(1, line.size() - 2);
    auto result = ${funcName}(line);
    ${printResult}`;
          } else if (/\bint\b/.test(ptype)) {
            return `    string line;
    getline(cin, line);
    // Remove "varname = " prefix if present
    auto eqPos = line.find('=');
    if (eqPos != string::npos) line = line.substr(eqPos + 1);
    // Trim
    line.erase(0, line.find_first_not_of(" "));
    line.erase(line.find_last_not_of(" ") + 1);
    auto result = ${funcName}(stoi(line));
    ${printResult}`;
          } else {
            // Fallback: try string, then int
            return `    string line;
    getline(cin, line);
    auto result = ${funcName}(line);
    ${printResult}`;
          }
        }
        
        // Multiple params: read separate lines or parse comma-separated
        // For now, read each argument from a new line or try to split the single line
        let argDecls = [];
        let argNames = [];
        paramTypes.forEach((ptype, idx) => {
          const argName = `arg${idx}`;
          argNames.push(argName);
          if (/vector\s*<\s*vector/.test(ptype)) {
            argDecls.push(`    string line${idx};
    getline(cin, line${idx});
    vector<vector<int>> ${argName};
    { int i = 1;
    while (i < (int)line${idx}.size()) {
        if (line${idx}[i] == '[') {
            vector<int> inner; i++;
            string num = "";
            while (i < (int)line${idx}.size() && line${idx}[i] != ']') {
                if (line${idx}[i] == ',') { if (!num.empty()) inner.push_back(stoi(num)); num = ""; }
                else if (line${idx}[i] != ' ') num += line${idx}[i];
                i++;
            }
            if (!num.empty()) inner.push_back(stoi(num));
            ${argName}.push_back(inner); i++;
        } else i++;
    } }`);
          } else if (/vector\s*<\s*int\s*>/.test(ptype)) {
            argDecls.push(`    string line${idx};
    getline(cin, line${idx});
    vector<int> ${argName};
    line${idx} = line${idx}.substr(1, line${idx}.size() - 2);
    { stringstream ss(line${idx}); string item;
    while (getline(ss, item, ',')) {
        item.erase(0, item.find_first_not_of(" "));
        item.erase(item.find_last_not_of(" ") + 1);
        if (!item.empty()) ${argName}.push_back(stoi(item));
    } }`);
          } else if (/\bstring\b/.test(ptype)) {
            argDecls.push(`    string ${argName};
    getline(cin, ${argName});
    if (${argName}.size() >= 2 && ${argName}[0] == '"' && ${argName}[${argName}.size()-1] == '"')
        ${argName} = ${argName}.substr(1, ${argName}.size() - 2);`);
          } else if (/\bint\b/.test(ptype)) {
            argDecls.push(`    string _line${idx};
    getline(cin, _line${idx});
    auto eqPos${idx} = _line${idx}.find('=');
    if (eqPos${idx} != string::npos) _line${idx} = _line${idx}.substr(eqPos${idx} + 1);
    _line${idx}.erase(0, _line${idx}.find_first_not_of(" "));
    _line${idx}.erase(_line${idx}.find_last_not_of(" ") + 1);
    int ${argName} = stoi(_line${idx});`);
          } else {
            argDecls.push(`    string ${argName};
    getline(cin, ${argName});`);
          }
        });
        
        return `${argDecls.join('\n')}
    auto result = ${funcName}(${argNames.join(', ')});
    ${printResult}`;
      };

      // Check if main exists
      if (!/\bmain\s*\(/.test(code)) {
        return `${cppIncludes}

${code}

int main() {
${generateMainBody()}
    return 0;
}`;
      }
      
      // If main exists and there's output handling, extract and wrap the helper function
      if (funcName && /\bcout\b|\bprintf\b/.test(code)) {
        const helperFunc = extractFunctionByName(code, funcName);
        if (helperFunc) {
          return `${cppIncludes}

${helperFunc}

int main() {
${generateMainBody()}
    return 0;
}`;
        }
      }
      
      return code;
    }

    case 'c':
      // Check if main exists
      if (!/\bmain\s*\(/.test(code)) {
        return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${code}

int main() {
    char line[1024];
    fgets(line, sizeof(line), stdin);
    
    // Remove trailing newline
    line[strcspn(line, "\\n")] = 0;
    
    // Parse array input like [1, 2, 3]
    if (line[0] == '[') {
        int arr[100], count = 0;
        char *ptr = line + 1;
        char *end = strchr(line, ']');
        char *token = strtok(ptr, ",");
        while (token && token < end) {
            arr[count++] = atoi(token);
            token = strtok(NULL, ",");
        }
        printf("%d\\n", ${funcName}(arr, count));
    } else {
        printf("%d\\n", ${funcName}(atoi(line)));
    }
    return 0;
}`;
      }
      
      // If main exists and there's output handling, extract and wrap the helper function
      if (funcName && /\bprintf\b|\bputs\b/.test(code)) {
        const helperFunc = extractFunctionByName(code, funcName);
        if (helperFunc) {
          return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${helperFunc}

int main() {
    char line[1024];
    fgets(line, sizeof(line), stdin);
    
    // Remove trailing newline
    line[strcspn(line, "\\n")] = 0;
    
    // Parse array input like [1, 2, 3]
    if (line[0] == '[') {
        int arr[100], count = 0;
        char *ptr = line + 1;
        char *end = strchr(line, ']');
        char copy[1024];
        strcpy(copy, ptr);
        copy[end - ptr] = 0;
        
        char *token = strtok(copy, ",");
        while (token) {
            arr[count++] = atoi(token);
            token = strtok(NULL, ",");
        }
        printf("%d\\n", ${funcName}(arr, count));
    } else {
        printf("%d\\n", ${funcName}(atoi(line)));
    }
    return 0;
}`;
        }
      }
      
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
  // Splits multi-arg inputs like "[2,7,11,15], 9" onto separate lines
  const normalizeInput = (input) => {
    if (!input) return '';
    let str = String(input).trim();
    
    // Split at top-level commas (outside brackets/braces/quotes)
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let args = [];
    let current = '';

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (inString) {
        current += ch;
        if (ch === stringChar && str[i - 1] !== '\\') inString = false;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        current += ch;
      } else if (ch === '[' || ch === '(' || ch === '{') {
        depth++;
        current += ch;
      } else if (ch === ']' || ch === ')' || ch === '}') {
        depth--;
        current += ch;
      } else if (ch === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) args.push(current.trim());

    // If multiple top-level args found, put each on its own line
    if (args.length > 1) {
      return args.join('\n');
    }

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
    // Fallback to sample_input1, sample_output1, etc. up to 10
    for (let i = 1; i <= 10; i++) {
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

      // Judge0 returns base64-encoded output when base64_encoded=true
      const decodeBase64 = (str) => str ? Buffer.from(str, 'base64').toString('utf8') : '';
      const stdout = decodeBase64(judgeResult.stdout).replace(/\x00/g, '').trim();
      const stderr = decodeBase64(judgeResult.stderr);
      const compileOutput = decodeBase64(judgeResult.compile_output);
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
