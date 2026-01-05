
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the missing section/div close at 1468
# Let's use a more robust search for this block.
target_1 = """                                    {topOpportunities.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>"""

# Wait, let's find the end of that block.
# It ends withIDX loop:
#                                                     </div>
#                                                 );
#                                             })}
#                                         </div>
#                                     ) : (
#                                         <div...
#                                         </div>
#                                     )}

# I need to find where that block ends and add the section/div close.
insertion_point = """                                        </div>
                                    )}"""

# If I find this, I add the closes.
# But there might be multiple. I want the one after live-opportunities-section.

section_start = content.find('<section className="live-opportunities-section"')
if section_start != -1:
    end_of_block = content.find('                                    )}', section_start)
    if end_of_block != -1:
        # Insert after the closing brace of the ternary/map
        content = content[:end_of_block + 38] + "\n                                </div>\n                            </section>" + content[end_of_block+38:]

# 2. Fix the end of the file
# Truncate and rewrite the tail correctly.
# Find the last occurrence of the advanced settings block closing.
last_div = content.rfind('        </div>')
if last_div != -1:
    # We want to replace everything from the last </div> and its parent structure
    # with a clean close.
    # Looking at the truncated file, it ended with:
    # 2073:         </div>
    # 2074:     )
    # 2075: }
    
    tail_pattern = r'</div>\s*?\)\s*?\}'
    fixed_tail = """        </div>
            </>
        </div>
    );
};"""
    content = re.sub(tail_pattern + r'\s*$', fixed_tail, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied structural repairs to Dashboard.jsx.")
