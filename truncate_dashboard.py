
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the first occurrence of the duplicate import block
# We know line 2076 was weird.
# Line 2076: "            { useState, useEffect } from 'react';"
# Line 2077: "import { CONFIG } from '../config';"

cut_index = -1
for i, line in enumerate(lines):
    if "import { CONFIG } from '../config';" in line and i > 100:
        # Check if previous lines also look like imports
        if "useState, useEffect" in lines[i-1]:
            cut_index = i - 1
            break

if cut_index != -1:
    print(f"Truncating file at line {cut_index + 1}")
    new_lines = lines[:cut_index]
    
    # We also need to make sure the file ends with the correct closing tags.
    # Looking at my previous view, 2075 was "}".
    # Let's see what's before cut_index.
    
    # Let's just make sure it ends with ) and }; if needed.
    # Actually, the FAQ and Advanced were moved.
    
    # Let's just write up to cut_index and see.
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("SUCCESS: Truncated duplicated content.")
else:
    print("FAILED: Could not find duplication point.")
