
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<>' in line:
        print(f"Open Fragment at line {i+1}: {line.strip()}")
    if '</>' in line:
        print(f"Close Fragment at line {i+1}: {line.strip()}")
    if 'return (' in line:
        print(f"Return Start at line {i+1}: {line.strip()}")
