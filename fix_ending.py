import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep everything up to line 2077 (index 2076)
final_lines = lines[:2077]

# Add correct final closure
final_lines.extend([
    '                            </div>\n',
    '                        </div>\n',
    '                    )}\n',
    '                </div>\n',
    '            )}\n',
    '        </div>\n',
    '    );\n',
    '};\n'
])

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Fixed file ending")
