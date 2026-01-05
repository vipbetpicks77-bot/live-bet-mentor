
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Find the end of Raw Data Explorer section
# It ends with </section> around 1705.
pattern_explorer_end = r'</section>\s+?(?=\{/\* Match Details Modal \*/\}|{selectedMatch &&)'
# Actually, let's just find the section and insert after.

explorer_search = content.find('className="dashboard-section explorer"')
if explorer_search != -1:
    section_end = content.find('</section>', explorer_search)
    if section_end != -1:
        # Insert </> after the section close
        content = content[:section_end + 10] + "\n                </>" + content[section_end + 10:]

# 2. Cleanup the tail
# Remove any misplaced fragments and ensured proper container closure.
# We want the file to end with:
#             { showFAQ && ... }
#             { showAdvanced && ... }
#         </div>
#     );
# };

# Find where showAdvanced ends
adv_end = content.rfind('className="league-management"')
if adv_end != -1:
    # Find the closing sequence of showAdvanced
    # 2071: </div>
    # 2072: </div>
    # 2073: </div>
    # 2074: </div>
    # 2075: </div>
    # 2076: </>
    # 2077: </div>
    
    # Let's just find the last few lines and replace with a clean close.
    # We need to close: modal-content settings, modal-overlay settings, dashboard-container.
    # Total 3 divs.
    
    # Search for the block starting from league-management maps loop end.
    map_end = content.rfind('))}')
    if map_end != -1:
        # From map_end, we should have closes for:
        # 1. leagues
        # 2. league-management
        # 3. modal-content (settings)
        # 4. modal-overlay (settings)
        # 5. dashboard-container
        # 6. return close
        # 7. component close
        
        tail = """                    </div>
                </div>
            </div>
        </div>
    );
};"""
        # Replace from map_end to end
        content = content[:map_end + 3] + "\n" + tail

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied final structural consolidation to Dashboard.jsx.")
