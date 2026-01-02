import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'server'))
from consensus_scraper import ConsensusScraper

scraper = ConsensusScraper()
print("Starting specific tests for Forebet and Vitibet...")
scraper.scrape_forebet()
scraper.scrape_vitibet()
scraper.save_results()
print("Test completed and data saved.")
