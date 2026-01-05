
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

s_braces = [] # { }
s_parens = [] # ( )

for i, line in enumerate(lines):
    # Ignore comments
    clean_line = line.split('//')[0]
    
    for char in clean_line:
        if char == '{': s_braces.append(i+1)
        elif char == '}': 
            if s_braces: s_braces.pop()
        elif char == '(': s_parens.append(i+1)
        elif char == ')':
            if s_parens: s_parens.pop()
            
    if i+1 >= 1470 and i+1 <= 1475:
        print(f"Line {i+1}: PDepth={len(s_parens)} {s_parens}, BDepth={len(s_braces)} {s_braces}")
