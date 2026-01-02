import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'server'))
from consensus_scraper import ConsensusScraper

def test_olbg():
    scraper = ConsensusScraper()
    print("Testing OLBG Global Popular Bets scraper...")
    scraper.scrape_olbg()
    
    olbg_data = scraper.results.get("olbg", [])
    print(f"Total OLBG predictions found: {len(olbg_data)}")
    
    if olbg_data:
        print("\nSample Data:")
        for m in olbg_data[:10]:
            market = list(m['markets'].keys())[0]
            pred = m['markets'][market]['pred']
            prob = m['markets'][market]['prob']
            print(f"- {m['home']} vs {m['away']} | League: {m['league']} | Market: {market} | Pred: {pred} | Prob: {prob}%")
            
    scraper.save_results()
    print("\nResults saved to consensus_data.json")

if __name__ == "__main__":
    test_olbg()
