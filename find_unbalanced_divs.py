
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # Find all <div and </div>
    # Using regex to find them while ignoring those in comments or strings (partially)
    
    # Simple check: find all occurrences of <div and </div>
    # and print their line numbers.
    opens = re.finditer(r'<div', line)
    closes = re.finditer(r'</div>', line)
    
    for _ in opens:
        stack.append(i + 1)
    for _ in closes:
        if stack:
            stack.pop()
        else:
            print(f"Extra closing </div> at line {i+1}")

if stack:
    print(f"Unclosed <div> tags started at lines: {stack}")
else:
    print("All <div> tags are balanced.")
