
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def count_tags(text):
    opens = len(re.findall(r'<div', text))
    closes = len(re.findall(r'</div>', text))
    return opens, closes

opens, closes = count_tags(content)
print(f"Total <div> tags: Opens={opens}, Closes={closes}")

# Check fragments too
f_opens = len(re.findall(r'<>', text)) if 'text' in locals() else len(re.findall(r'<>', content))
f_closes = len(re.findall(r'</>', content))
print(f"Total Fragments: Opens={f_opens}, Closes={f_closes}")

# Check sections
s_opens = len(re.findall(r'<section', content))
s_closes = len(re.findall(r'</section>', content))
print(f"Total <section> tags: Opens={s_opens}, Closes={s_closes}")

# Check other common ones
h_opens = len(re.findall(r'<header', content))
h_closes = len(re.findall(r'</header>', content))
print(f"Total <header> tags: Opens={h_opens}, Closes={h_closes}")
