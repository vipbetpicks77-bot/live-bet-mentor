
import json
from consensus_scraper import ConsensusScraper

def test_times():
    scraper = ConsensusScraper()
    print("Testing All Scrapers for Time Extraction...")
    
    # We'll test the most promising ones
    print("\n--- Testing Forebet ---")
    scraper.scrape_forebet()
    
    print("\n--- Testing Statarea ---")
    scraper.scrape_statarea()
    
    print("\n--- Testing Zulubet ---")
    scraper.scrape_zulubet()
    
    print("\n--- Testing ProSoccer ---")
    scraper.scrape_prosoccer()
    
    print("\n--- Testing WinDrawWin ---")
    scraper.scrape_windrawwin()
    
    scraper.save_results()
    
    with open("server/consensus_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    for site in ["forebet", "statarea", "zulubet", "prosoccer", "windrawwin"]:
        if site in data and len(data[site]) > 0:
            m = data[site][0]
            print(f"{site.upper()}: Found match '{m['home']} vs {m['away']}' with time '{m.get('time', 'N/A')}'")
        else:
            print(f"{site.upper()}: No data found")

if __name__ == "__main__":
    test_times()
