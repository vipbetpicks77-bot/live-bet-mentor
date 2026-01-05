
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
lines = text.split('\n')
clean_lines = []
for line in lines:
    clean_lines.append(line.split('//')[0])

s_braces = []
s_parens = []

for i, line in enumerate(clean_lines):
    line = re.sub(r'"[^"]*"', '""', line)
    line = re.sub(r"'[^']*'", "''", line)
    line = re.sub(r"`[^`]*`", "``", line)
    
    for char in line:
        if char == '{': s_braces.append(i+1)
        elif char == '}': 
            if s_braces: s_braces.pop()
        elif char == '(': s_parens.append(i+1)
        elif char == ')':
            if s_parens: s_parens.pop()
            
    if i+1 >= 1704 and i+1 <= 1708:
        print(f"Line {i+1}: PDepth={len(s_parens)} {s_parens}, BDepth={len(s_braces)} {s_braces}")
