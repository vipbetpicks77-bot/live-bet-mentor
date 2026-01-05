
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from consensus_scraper import ConsensusScraper

def test():
    scraper = ConsensusScraper()
    print("Testing Forebet Scraping with increased scrolls...")
    scraper.scrape_forebet()
    
    found = False
    for m in scraper.results.get("forebet", []):
        if "Espanyol" in m["home"] or "Barcelona" in m["away"]:
            print(f"FOUND: {m['home']} vs {m['away']} | Pred: {m['markets']['1X2']['pred']} | Prob: {m['markets']['1X2']['prob']}")
            found = True
            
    if not found:
        print("Barcelona match NOT found in Forebet results.")
    else:
        print("SUCCESS: Barcelona match found.")

if __name__ == "__main__":
    test()
