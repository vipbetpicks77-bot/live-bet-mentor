
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

replaced = False
for i in range(1600, len(lines)):
    if '</>' in lines[i]:
        lines[i] = lines[i].replace('</>', '</div>')
        print(f"Replaced line {i+1}")
        replaced = True
        break

if not replaced:
    print("Could not find </> in expected range")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
