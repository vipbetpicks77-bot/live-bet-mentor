
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: Close the ternary at 1706
for i, line in enumerate(lines):
    if i == 1705 and '</>' in line: # lines is 0-indexed, so 1705 is line 1706
        lines[i] = "                </>\n            )}\n"
        break

# Fix 2: Ensure correct tail
# We need 3 div closes for the end of the file (modal-content, modal-overlay, dashboard-container)
# Plus the return and component closes.

# Let's find the map end near the end
last_map_end = -1
for i in range(len(lines)-1, 0, -1):
    if '))}' in lines[i]:
        last_map_end = i
        break

if last_map_end != -1:
    new_tail = [
        "                    </div>\n",
        "                </div>\n",
        "            </div>\n",
        "        </div>\n",
        "    );\n",
        "};\n"
    ]
    # Replace everything from last_map_end + 1 with new_tail
    lines = lines[:last_map_end + 1] + new_tail

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Applied final structural fix to Dashboard.jsx.")
