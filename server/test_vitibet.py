from consensus_scraper import ConsensusScraper
import json

def test_vitibet():
    scraper = ConsensusScraper()
    print("Testing Vitibet individually...")
    scraper.scrape_vitibet()
    count = len(scraper.results.get("vitibet", []))
    print(f"VITIBET RESULT: Found {count} predictions.")
    if count > 0:
        scraper.save_results()
        print("Data saved.")
    else:
        print("No predictions, not saving.")

if __name__ == "__main__":
    test_vitibet()
