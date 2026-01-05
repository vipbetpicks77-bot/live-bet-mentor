
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 2080 is index 2079
# We want to keep everything up to line 2079 (exclusive of the messy ones)
# Wait, let's keep up to line 2078 (index 2077)
final_lines = lines[:2078]

# Add correct closure
final_lines.extend([
    '                    </div>\n',
    '                </div>\n',
    '            )}\n',
    '        </div>\n',
    '    );\n',
    '};\n'
])

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)
