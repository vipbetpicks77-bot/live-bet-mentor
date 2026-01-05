import json
import os

path = r'c:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\server\sofascore_live.json'
if not os.path.exists(path):
    print(f"File not found: {path}")
    exit()

with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

search_terms = ["PSM", "Sarmiento"]
events = data.get('events', [])

print(f"Total events: {len(events)}")

found = []
for event in events:
    home = event.get('homeTeam', {}).get('name', '')
    away = event.get('awayTeam', {}).get('name', '')
    if any(term.lower() in home.lower() or term.lower() in away.lower() for term in search_terms):
        found.append({
            'id': event.get('id'),
            'home': home,
            'away': away,
            'status': event.get('status', {}).get('description'),
            'score': f"{event.get('homeScore', {}).get('current')} - {event.get('awayScore', {}).get('current')}"
        })

if found:
    for f in found:
        print(f"FOUND: ID={f['id']} | {f['home']} vs {f['away']} | Status={f['status']} | Score={f['score']}")
else:
    print("No matches found with search terms.")
