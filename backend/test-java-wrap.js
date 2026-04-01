// Test Java/C++ code execution — both full-class and function-only
const API = 'http://localhost:8000/api/v1/runcode';

const question = {
  sample_input1: '()',
  sample_output1: 'true',
  sample_input2: '()[]{}',
  sample_output2: 'true',
  sample_input3: '(]',
  sample_output3: 'false',
};

// Full class with main() and System.out.println — should extract function and rewrap
const javaFullClass = `import java.util.Stack;

public class ValidParentheses {
    public static boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') {
                stack.push(ch);
            } else {
                if (stack.isEmpty()) return false;
                char last = stack.pop();
                if ((ch == ')' && last != '(') ||
                    (ch == ']' && last != '[') ||
                    (ch == '}' && last != '{')) {
                    return false;
                }
            }
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) {
        System.out.println(isValid("()"));
        System.out.println(isValid("()[]{}"));
        System.out.println(isValid("(]"));
    }
}`;

// Function only — should be wrapped with Main class and stdin reading
const javaFuncOnly = `public boolean isValid(String s) {
    java.util.Stack<Character> stack = new java.util.Stack<>();
    for (char ch : s.toCharArray()) {
        if (ch == '(' || ch == '[' || ch == '{') {
            stack.push(ch);
        } else {
            if (stack.isEmpty()) return false;
            char last = stack.pop();
            if ((ch == ')' && last != '(') ||
                (ch == ']' && last != '[') ||
                (ch == '}' && last != '{')) {
                return false;
            }
        }
    }
    return stack.isEmpty();
}`;

// C++ full program
const cppFullProgram = `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') || (c == ']' && top != '[') || (c == '}' && top != '{'))
                return false;
        }
    }
    return st.empty();
}

int main() {
    cout << boolalpha << isValid("()") << endl;
    cout << boolalpha << isValid("()[]{}") << endl;
    cout << boolalpha << isValid("(]") << endl;
}`;

// C++ function only
const cppFuncOnly = `bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') || (c == ']' && top != '[') || (c == '}' && top != '{'))
                return false;
        }
    }
    return st.empty();
}`;

async function testCode(label, code, language) {
  console.log(`\n=== ${label} (${language}) ===`);
  try {
    const res = await fetch(`${API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, code, language }),
    });
    const data = await res.json();
    if (data.data && data.data.results) {
      const expected = [question.sample_output1, question.sample_output2, question.sample_output3];
      data.data.results.forEach((r, i) => {
        const status = r.pass ? '✅ PASS' : '❌ FAIL';
        console.log(`  Test ${i+1}: ${status} | Expected: ${expected[i]} | Got: ${(r.output || '').trim()}`);
        if (!r.pass && r.explanation) console.log(`    Reason: ${r.explanation.substring(0, 300)}`);
      });
    } else {
      console.log('  Error:', JSON.stringify(data).substring(0, 500));
    }
  } catch (e) {
    console.log('  Fetch error:', e.message);
  }
}

(async () => {
  await testCode('Java full class', javaFullClass, 'java');
  await testCode('Java function only', javaFuncOnly, 'java');
  await testCode('C++ full program', cppFullProgram, 'cpp');
  await testCode('C++ function only', cppFuncOnly, 'cpp');
})();
