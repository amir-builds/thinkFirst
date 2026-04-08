#!/usr/bin/env node

// Manually test the wrapper function
const code = `int add(int a, int b) {
    return a + b;
}`;

const funcRegex = /(?:int|void|string|bool|double|float|long|char|vector<[^>]+>)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;
const match = code.match(funcRegex);

console.log("=== C++ Function Detection ===");
console.log("Code:", code);
console.log("Regex match:", match);
console.log("Function name:", match ? match[1] : "NOT FOUND");

// Now test what the wrapper would create
if (match && match[1] !== 'main') {
    const funcName = match[1];
    const wrapped = `#include <iostream>
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
    if (!line.empty() && line[0] == '[') {
        vector<int> arr;
        string arrayContent = line.substr(1, line.size() - 2);
        stringstream ss(arrayContent);
        string item;
        while (getline(ss, item, ',')) {
            item.erase(0, item.find_first_not_of(" "));
            item.erase(item.find_last_not_of(" ") + 1);
            if (!item.empty()) arr.push_back(stoi(item));
        }
        cout << ${funcName}(arr) << endl;
    } else if (!line.empty()) {
        cout << ${funcName}(line) << endl;
    }
    return 0;
}`;

    console.log("\n=== Wrapped Code ===");
    console.log(wrapped);
    
    console.log("\n=== Issue ===");
    console.log("The wrapper tries to call add(arr) but add() expects (int, int)!");
    console.log("The wrapper tries to call add(line) but add() expects (int, int)!");
}
