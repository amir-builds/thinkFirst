#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000/api/v1"

echo "================================"
echo "Testing C++ Code Execution"
echo "================================"

# Create JSON payload for C++
CPP_PAYLOAD=$(cat <<EOF
{
  "language": "cpp",
  "code": "#include <iostream>\n#include <stack>\nusing namespace std;\n\nbool isValid(string s) {\n    stack<char> st;\n\n    for (char ch : s) {\n        if (ch == '(' || ch == '[' || ch == '{') {\n            st.push(ch);\n        } \n        else {\n            if (st.empty()) return false;\n\n            char last = st.top();\n            st.pop();\n\n            if ((ch == ')' && last != '(') ||\n                (ch == ']' && last != '[') ||\n                (ch == '}' && last != '{')) {\n                return false;\n            }\n        }\n    }\n\n    return st.empty();\n}\n\nint main() {\n    cout << isValid(\"()\") << endl;\n    cout << isValid(\"()[]{}\") << endl;\n    cout << isValid(\"(]\") << endl;\n    return 0;\n}",
  "question": {
    "testCases": [
      { "input": "()", "output": "1" },
      { "input": "()[]{}", "output": "1" },
      { "input": "(]", "output": "0" }
    ]
  }
}
EOF
)

echo -e "${YELLOW}Testing C++ - Valid Parentheses Problem${NC}"
echo "Sending request to $BASE_URL/runcode/execute"
echo ""

CPP_RESPONSE=$(curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$CPP_PAYLOAD")

echo "Response:"
echo "$CPP_RESPONSE" | jq '.' 2>/dev/null || echo "$CPP_RESPONSE"
echo ""

# Extract pass status
CPP_PASS=$(echo "$CPP_RESPONSE" | jq '.data.results[0].pass' 2>/dev/null)
if [ "$CPP_PASS" = "true" ]; then
  echo -e "${GREEN}✅ C++ Test Case 1: PASSED${NC}"
else
  echo -e "${RED}❌ C++ Test Case 1: FAILED${NC}"
fi

echo ""
echo "================================"
echo "Testing Java Code Execution"
echo "================================"

# Test 2: Java Sum Two Numbers Problem
JAVA_PAYLOAD=$(cat <<EOF
{
  "language": "java",
  "code": "public class Solution {\n    public int twoSum(int[] nums, int target) {\n        int sum = 0;\n        for (int num : nums) {\n            sum += num;\n        }\n        return sum == target ? 1 : 0;\n    }\n}",
  "question": {
    "testCases": [
      { "input": "2", "output": "2" },
      { "input": "5", "output": "5" },
      { "input": "10", "output": "10" }
    ]
  }
}
EOF
)

echo -e "${YELLOW}Testing Java - Simple Calculation${NC}"
echo "Sending request to $BASE_URL/runcode/execute"
echo ""

JAVA_RESPONSE=$(curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$JAVA_PAYLOAD")

echo "Response:"
echo "$JAVA_RESPONSE" | jq '.' 2>/dev/null || echo "$JAVA_RESPONSE"
echo ""

JAVA_PASS=$(echo "$JAVA_RESPONSE" | jq '.data.results[0].pass' 2>/dev/null)
if [ "$JAVA_PASS" = "true" ]; then
  echo -e "${GREEN}✅ Java Test Case 1: PASSED${NC}"
else
  echo -e "${RED}❌ Java Test Case 1: FAILED${NC}"
fi

echo ""
echo "================================"
echo "Summary"
echo "================================"
echo "Check the responses above for detailed results"
