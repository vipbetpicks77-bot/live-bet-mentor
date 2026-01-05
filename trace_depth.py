
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

s_braces = [] # { }
s_parens = [] # ( )

for i, line in enumerate(lines):
    # Ignore comments for brace/paren tracking (simple)
    clean_line = line.split('//')[0]
    
    for char in clean_line:
        if char == '{': s_braces.append(i+1)
        elif char == '}': 
            if s_braces: s_braces.pop()
            else: print(f"Extra }} at line {i+1}")
        elif char == '(': s_parens.append(i+1)
        elif char == ')':
            if s_parens: s_parens.pop()
            else: print(f"Extra ) at line {i+1}")
            
    # Report depth at suspected line
    if i+1 == 1472:
        print(f"--- Line 1472 stats ---")
        print(f"Paren Depth: {len(s_parens)}")
        print(f"Brace Depth: {len(s_braces)}")
        if s_parens: print(f"Deepest open paren at line: {s_parens[-1]}")
        if s_braces: print(f"Deepest open brace at line: {s_braces[-1]}")

print(f"Final unclosed braces: {len(s_braces)}")
print(f"Final unclosed parens: {len(s_parens)}")
