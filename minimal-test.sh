#!/bin/bash

# Simpler test - just test the simplest possible C++ code
BASE_URL="http://localhost:8000/api/v1"

# Absolute simplest C++ - no main, just a function
MINIMAL_CPP=$(cat <<'EOF'
{
  "language": "cpp",
  "code": "int add(int a, int b) {\n    return a + b;\n}",
  "question": {
    "testCases": [
      { "input": "5", "output": "5" }
    ]
  }
}
EOF
)

echo "================================"
echo "Minimal C++ Test"
echo "================================"
curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$MINIMAL_CPP" | jq '.data.results[0]'

echo ""
echo "================================"
echo "Minimal Java Test"
echo "================================"

# Minimal Java - no class, just a method
MINIMAL_JAVA=$(cat <<'EOF'
{
  "language": "java",
  "code": "int add(int a, int b) {\n    return a + b;\n}",
  "question": {
    "testCases": [
      { "input": "5", "output": "5" }
    ]
  }
}
EOF
)

curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$MINIMAL_JAVA" | jq '.data.results[0]'
