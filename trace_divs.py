
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Strip comments for div tracking
text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
text = re.sub(r'//.*', '', text)

# Find all <div or </div>
div_starts = [m.start() for m in re.finditer(r'<div\b', text)]
div_ends = [m.start() for m in re.finditer(r'</div\s*>', text)]

tags = []
for pos in div_starts: tags.append((pos, 'start'))
for pos in div_ends: tags.append((pos, 'end'))

tags.sort()

stack = []
for pos, type in tags:
    line_num = text.count('\n', 0, pos) + 1
    if type == 'start':
        stack.append(line_num)
    else:
        if stack:
            stack.pop()
        else:
            print(f"Extra </div> at line {line_num}")

print(f"Unclosed divs started at: {stack}")
