import os
import json
import time
from datetime import datetime
import undetected_chromedriver as uc

OUTPUT_FILE = r"c:\Users\ok\Desktop\Is Projeleri\LIVE\LIVEBETCODE\server\consensus_data.json"

class TestScraper:
    def get_driver(self):
        options = uc.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        options.add_argument(f"user-agent={ua}")
        return uc.Chrome(options=options)

    def scrape_zulubet(self):
        print("Final Debug Zulubet...")
        driver = self.get_driver()
        try:
            driver.get("https://www.zulubet.com/")
            time.sleep(10)
            rows = driver.find_elements("css selector", "tr")
            for idx, row in enumerate(rows):
                if "Melbourne Victory" in row.text:
                    cells = row.find_elements("css selector", "td")
                    print(f"Row {idx} cells found: {len(cells)}")
                    for i, c in enumerate(cells):
                        print(f"  [{i}]: '{c.get_attribute('textContent').strip()}'")
                    break
        finally: driver.quit()

if __name__ == "__main__":
    t = TestScraper()
    t.scrape_zulubet()
