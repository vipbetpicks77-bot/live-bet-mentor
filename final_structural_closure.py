
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Truncate lines after 2078
lines = lines[:2078]

# Add correct closure
lines.append('                    </div>\n')
lines.append('                )\n')
lines.append('            }\n')
lines.append('        </div>\n')
lines.append('    );\n')
lines.append('};\n')

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
