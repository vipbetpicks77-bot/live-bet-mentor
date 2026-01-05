
import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove the misplaced tags at 1393-1394
# Note: 1393 is lines[1392]
if "</div>" in lines[1392] and "</section>" in lines[1393]:
    print("Found misplaced tags at 1393-1394. Removing them.")
    lines.pop(1393) # Remove </section>
    lines.pop(1392) # Remove </div>

# Now find the REAL end of the section and insert them there.
# The section ends after the ternary {topOpportunities.length > 0 ? (...) : (...)}
# which ends at line 1468.
# But wait, lines shifted.

for i in range(len(lines)):
    if "{/* Analysis Candidates */}" in lines[i]:
        # Insert before this comment
        # We need to close:
        # 1. inner div (if any)
        # 2. glass-panel div (line 1314)
        # 3. live-opportunities-section (line 1313)
        
        # Let's see what's currently before this comment.
        print(f"Insertion point found at line {i+1}")
        
        # We should already have the ternary close ')}' at i-1 or i-2.
        lines.insert(i, "                                </div>\n                            </section>\n")
        break

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Applied surgery to fix misplaced tags.")
