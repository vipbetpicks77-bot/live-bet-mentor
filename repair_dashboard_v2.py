
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 1. Fix character corruption first
rep = {
    'ç¢â€šÂº': '₺',
    'ğş¸â€ºâ€˜': '⛔',
    ' ç¯Â¸Â ': '⚠️',
    'ç¢â‚¬Â¢': '•',
    'ğş¸ÂŽÂ¯': '🎯',
    'ç¢â€ â€˜': '↑',
    'ç¢â€ â€œ': '↓',
    'ç¢â€ â€™': '→',
    'ğş¸â€œÂ¡': '📡',
    'Ã¢Å¡Â⚡': '⚡',
    'ğŸŒ': '🌐', 
    'Ã„Â°': 'İ',
    'Ã„Â±': 'ı',
    'ÅŸ': 'ş',
    'Ã§': 'ç',
    'Ã¼': 'ü',
    'Åž': 'Ş',
    'Ä°': 'İ',
    'ÄŸ': 'ğ',
    'Ã¶': 'ö',
    'Ä±': 'ı',
    'ÃƒÂ¼': 'ü',
    'Ã„Â': 'İ',
    'Ãƒâ€¡': 'Ç',
    'Ã„â„¢': 'ğ',
    'ÃƒÂ¶': 'ö',
    'Ã¢Å¡Â': '',
    'MAÃƒâ€¡': 'MAÇ',
    'Ä°STÄ°HBARAT': 'İSTİHBARAT',
    'BEKLENÃ„Â°YOR': 'BEKLENİYOR',
    'ç…Âž': 'ş',
    'ç…ş': 'ş',
    'seü§im': 'seçim',
    'Tartıç…ş¸malı': 'Tartışmalı',
    'Maü§': 'Maç',
    'çƒâ€”': '×',
    'ç¢â€¡â€ž': '✕',
    'ÃÃ': 'ü',
    'ÃƒÂ': 'ü',
    'Ã„': 'İ',
    'Å': 'ş',
    'Ã': 'ç'
}

for k, v in rep.items():
    content = content.replace(k, v)

# 2. Structural Fix
# We need to find the premature closing of the component and move the FAQ/Advanced blocks inside.

# Pattern to find:
#             {/* Match Details Modal end */}
#         </>
#     )
# }
# 
# { showFAQ ... }
# 
# {
#     showAdvanced ...
# }
#         </div >
#     );
# };

# Let's use a more robust approach.
# Find the exact lines that close the component early.

premature_end = """            {/* Match Details Modal end */}
        </>
    )
}"""

# We want to replace it with just the end of the modal block, and keep the fragment open.
# Wait, let's see where the main return starts.
# It probably starts with "return (" and is wrapped in a <div> or <>.

# Actually, let's just surgically move the blocks.

# Search for the block starting with "{ showFAQ"
faq_match = re.search(r'\{ showFAQ && <FAQ.*?\n\}', content, re.DOTALL)
advanced_match = re.search(r'\{.*?showAdvanced && \(.*?\n\}', content, re.DOTALL)

if faq_match and advanced_match:
    faq_block = faq_match.group(0)
    advanced_block = advanced_match.group(0)
    
    # Remove them from their current position (at the end)
    content = content.replace(faq_block, "")
    content = content.replace(advanced_block, "")
    
    # Find the place before line 2022
    target = "{/* Match Details Modal end */}"
    insertion = f"\n            {faq_block}\n            {advanced_block}\n"
    
    content = content.replace(target, target + insertion)

# Remove the extra concluding stuff at the very end
# Looking at lines 2080-2082:
#         </div >
#     );
# };
content = re.sub(r'</div >\s*?\);\s*?};', '', content)

# Check if there's any dangling fragment close
# Replace '        </>\n    )\n}' with '        </div>\n    )\n}' if needed
# Actually let's just make sure it ends correctly.

# Ensure the file ends with a clean component close.
# The component starts with "export const Dashboard = ({ user, onLogout }) => {"
# It should end with "};"

# Let's find the last "    )\n}" and ensure it has the correct closing tags.
# In my previous view, it was:
# 2022:         </>
# 2023:     )
# 2024: }

# This looks correct for the function, but it needs to include the FAQ/Advanced blocks.

# Let's verify the very end of the file now.
# I'll just rewrite the end carefully.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Repaired Dashboard.jsx structure.")
