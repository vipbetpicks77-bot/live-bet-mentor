import os

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep everything up to line 2077 (index 2076)
final_lines = lines[:2077]

# Add correct final closure
correct_ending = '''                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
'''

final_lines.append(correct_ending)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Fixed file ending")
