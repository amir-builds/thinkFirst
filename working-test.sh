#!/bin/bash

BASE_URL="http://localhost:8000/api/v1"

echo "================================"
echo "C++ Test 1 - Single Int Parameter"
echo "================================"

# Function that takes a single int
SINGLE_PARAM_CPP=$(cat <<'EOF'
{
  "language": "cpp",
  "code": "int square(int x) {\n    return x * x;\n}",
  "question": {
    "testCases": [
      { "input": "5", "output": "25" },
      { "input": "3", "output": "9" },
      { "input": "0", "output": "0" }
    ]
  }
}
EOF
)

curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$SINGLE_PARAM_CPP" | jq '.data.results[]'

echo ""
echo "================================"
echo "C++ Test 2 - String Validation (from problem)"
echo "================================"

# The original isValid() problem - takes a string
ISVALID_CPP=$(cat <<'EOF'
{
  "language": "cpp",
  "code": "#include <stack>\nbool isValid(string s) {\n    stack<char> st;\n    for (char ch : s) {\n        if (ch == '(' || ch == '[' || ch == '{') {\n            st.push(ch);\n        } else {\n            if (st.empty()) return false;\n            char last = st.top();\n            st.pop();\n            if ((ch == ')' && last != '(') || (ch == ']' && last != '[') || (ch == '}' && last != '{')) {\n                return false;\n            }\n        }\n    }\n    return st.empty();\n}",
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

echo "Testing isValid with string input:"
curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$ISVALID_CPP" | jq '.data.results[]'
