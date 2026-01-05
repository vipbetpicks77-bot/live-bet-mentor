
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'rb') as f:
    lines = f.readlines()

target_line_idx = 1472 - 1
for i in range(target_line_idx - 5, target_line_idx + 5):
    if i < len(lines):
        print(f"Line {i+1}: {repr(lines[i])}")
