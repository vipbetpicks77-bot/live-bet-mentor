
import os
import re

path = r"C:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\src\components\Dashboard.jsx"

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

def count_tags(text):
    # Flexible regex for div tags
    opens = len(re.findall(r'<div', text))
    closes = len(re.findall(r'</div\s*>', text))
    return opens, closes

opens, closes = count_tags(text)
print(f"Total <div> tags: Opens={opens}, Closes={closes}")

f_opens = len(re.findall(r'<>', text))
f_closes = len(re.findall(r'</>', text))
print(f"Total Fragments: Opens={f_opens}, Closes={f_closes}")

s_opens = len(re.findall(r'<section', text))
s_closes = len(re.findall(r'</section>', text))
print(f"Total <section> tags: Opens={s_opens}, Closes={s_closes}")
