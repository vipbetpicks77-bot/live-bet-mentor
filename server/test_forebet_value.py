from consensus_scraper import ConsensusScraper
import json

def test_forebet():
    scraper = ConsensusScraper()
    print("Testing Forebet with Probability...")
    scraper.scrape_forebet()
    
    results = scraper.results.get("forebet", [])
    print(f"Found {len(results)} predictions.")
    
    if results:
        print("Sample results with probability:")
        for r in results[:5]:
            print(f"{r['home']} vs {r['away']} | Pred: {r['prediction']} | Prob: {r.get('probability', 'N/A')}")
        
        scraper.save_results()
        print("\nData collected. You can check consensus_data.json content.")
    else:
        print("No results found!")

if __name__ == "__main__":
    test_forebet()
