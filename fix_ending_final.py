import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Truncate file at line 2082 (index 2081) - keeping up to showAdvanced )} closure
final_lines = lines[:2082]

# Add correct closure sequence
correct_ending = """            </div>
        )}
        </div>
    );
};
"""

final_lines.append(correct_ending)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Fixed file ending - new length:", len(final_lines))
