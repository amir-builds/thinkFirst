import { wrapCodeWithBoilerplate } from './src/controllers/codeExecution.controller.js';

// Test case 1: User's isValid() problem - Complete solution with main()
const cppCode = `#include <iostream>
#include <stack>
using namespace std;

bool isValid(string s) {
    stack<char> st;

    for (char ch : s) {
        // opening brackets → push
        if (ch == '(' || ch == '[' || ch == '{') {
            st.push(ch);
        } 
        // closing brackets
        else {
            if (st.empty()) return false;

            char last = st.top();
            st.pop();

            if ((ch == ')' && last != '(') ||
                (ch == ']' && last != '[') ||
                (ch == '}' && last != '{')) {
                return false;
            }
        }
    }

    return st.empty();
}

int main() {
    cout << isValid("()") << endl;       // 1 (true)
    cout << isValid("()[]{}") << endl;   // 1 (true)
    cout << isValid("(]") << endl;       // 0 (false)
    return 0;
}`;

console.log("=== Test: C++ Complete Solution ===");
console.log("Input code has main():", /\bmain\s*\(/.test(cppCode));
console.log("Input code has cout:", /\bcout\b/.test(cppCode));
console.log("\nOriginal code length:", cppCode.length);

// Since we can't directly import the function, let's at least verify the regex logic
const hasMain = /\bmain\s*\(/.test(cppCode);
const hasCout = /\bcout\b/.test(cppCode);

console.log("\n✅ Detection logic:");
console.log(`   - Has main(): ${hasMain}`);
console.log(`   - Has cout: ${hasCout}`);
console.log(`   - Will extract function: ${hasMain && hasCout}`);

console.log("\n💡 Expected behavior:");
console.log("1. Extract isValid() function");
console.log("2. Wrap it with proper stdin/stdout handling");
console.log("3. Each test case calls isValid() once with specific input");
console.log("4. Output is compared against single expected output per test case");
