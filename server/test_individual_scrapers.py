import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from consensus_scraper import ConsensusScraper

def test_scrapers():
    scraper = ConsensusScraper()
    
    test_methods = [
        ("Forebet", scraper.scrape_forebet),
        ("PredictZ", scraper.scrape_predictz),
        ("WinDrawWin", scraper.scrape_windrawwin),
        ("Statarea", scraper.scrape_statarea),
        ("Vitibet", scraper.scrape_vitibet),
        ("Zulubet", scraper.scrape_zulubet)
    ]
    
    print("=== CONSENSUS SCRAPER TEST ===\n")
    
    for name, method in test_methods:
        print(f"Testing {name}...")
        try:
            method()
            count = len(scraper.results.get(name.lower(), []))
            print(f"RESULT: {name} found {count} predictions.\n")
        except Exception as e:
            print(f"ERROR: {name} failed with error: {e}\n")
            
    print("=== TEST COMPLETED ===")
    if scraper.results:
        scraper.save_results()

if __name__ == "__main__":
    test_scrapers()
