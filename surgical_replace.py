
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 1129 is index 1128
if '<>' in lines[1128]:
    lines[1128] = lines[1128].replace('<>', '<div className="dashboard-content-main">')
    print("Replaced line 1129")

# Line 1706 is index 1705
if '</>' in lines[1705]:
    lines[1705] = lines[1705].replace('</>', '</div>')
    print("Replaced line 1706")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
