import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'server'))
from consensus_scraper import ConsensusScraper

def test_zulubet_v2():
    scraper = ConsensusScraper()
    print("Testing improved Zulubet scraper...")
    scraper.scrape_zulubet()
    
    zulubet_data = scraper.results.get("zulubet", [])
    print(f"Total Zulubet matches found: {len(zulubet_data)}")
    
    if zulubet_data:
        print("\nSample Data:")
        for m in zulubet_data[:10]:
            print(f"- {m['home']} vs {m['away']} | League: {m['league']} | Pred: {m['markets']['1X2']['pred']}")
            
    scraper.save_results()
    print("\nResults saved to consensus_data.json")

if __name__ == "__main__":
    test_zulubet_v2()
