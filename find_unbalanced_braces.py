
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

s_braces = [] # { }
s_parens = [] # ( )

for i, line in enumerate(lines):
    # Only look for ones that are likely code, not in strings as much
    # (Simplified check)
    for char in line:
        if char == '{': s_braces.append(i+1)
        elif char == '}': 
            if s_braces: s_braces.pop()
            else: print(f"Extra }} at line {i+1}")
        elif char == '(': s_parens.append(i+1)
        elif char == ')':
            if s_parens: s_parens.pop()
            else: print(f"Extra ) at line {i+1}")

print(f"Unclosed braces started at: {s_braces}")
print(f"Unclosed parens started at: {s_parens}")
