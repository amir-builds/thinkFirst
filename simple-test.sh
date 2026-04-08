#!/bin/bash

# Test with simpler C++ code that doesn't rely on string input
BASE_URL="http://localhost:8000/api/v1"

echo "================================"
echo "Testing C++ - Simple Addition"
echo "================================"

# Simple C++ code that takes two integers and returns sum
SIMPLE_CPP=$(cat <<'EOF'
{
  "language": "cpp",
  "code": "#include <iostream>\nusing namespace std;\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    cout << add(2, 3) << endl;\n    cout << add(5, 5) << endl;\n    cout << add(10, 20) << endl;\n    return 0;\n}",
  "question": {
    "testCases": [
      { "input": "2, 3", "output": "5" },
      { "input": "5, 5", "output": "10" },
      { "input": "10, 20", "output": "30" }
    ]
  }
}
EOF
)

echo "Test 1: C++ with Complete Solution (has main())"
curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$SIMPLE_CPP" | jq '.'

echo ""
echo "================================"
echo "Testing C++ - Helper Function Only"
echo "================================"

# C++ code WITHOUT main() - should be wrapped by backend
HELPER_CPP=$(cat <<'EOF'
{
  "language": "cpp",
  "code": "#include <iostream>\nusing namespace std;\n\nint add(int a, int b) {\n    return a + b;\n}",
  "question": {
    "testCases": [
      { "input": "2, 3", "output": "5" },
      { "input": "5, 5", "output": "10" }
    ]
  }
}
EOF
)

echo "Test 2: C++ with Helper Function Only (no main())"
curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$HELPER_CPP" | jq '.'

echo ""
echo "================================"
echo "Testing Java - Simple Code"
echo "================================"

# Java without public class Main - should be wrapped
JAVA_CODE=$(cat <<'EOF'
{
  "language": "java",
  "code": "public int add(int a, int b) {\n    return a + b;\n}",
  "question": {
    "testCases": [
      { "input": "2, 3", "output": "5" },
      { "input": "5, 5", "output": "10" }
    ]
  }
}
EOF
)

echo "Test 3: Java with Helper Method Only"
curl -s -X POST "$BASE_URL/runcode/execute" \
  -H "Content-Type: application/json" \
  -d "$JAVA_CODE" | jq '.'
