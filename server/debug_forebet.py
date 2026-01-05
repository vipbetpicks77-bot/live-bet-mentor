
import sys
import os
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

def debug_forebet_row():
    """Debug Forebet row structure to identify correct selectors"""
    url = "https://www.forebet.com/en/football-tips-and-predictions-for-today/predictions-1x2"
    print(f"Opening: {url}")
    
    options = uc.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    driver = uc.Chrome(options=options, headless=False)
    
    try:
        driver.get(url)
        time.sleep(10)
        
        # Scroll to load more
        for _ in range(5):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
        
        # Find Espanyol row
        rows = driver.find_elements(By.CSS_SELECTOR, '.rcnt')
        print(f"Found {len(rows)} rows")
        
        for row in rows:
            try:
                text = row.text
                if "Espanyol" in text and "Barcelona" in text:
                    print("\n=== FOUND BARCELONCA MATCH ===")
                    print(f"Row Text:\n{text}")
                    print("\n--- Checking selectors ---")
                    
                    # Check all possible prediction selectors
                    selectors = [
                        '.forepr', '.forepr span', '.ex_pr', '.ex_pr span',
                        '.fprc span', '.fprc_cont span', '.predict span',
                        '.prob_dsc', '.prob_dsc span', 'span[class*="green"]',
                        '[class*="forepr"]', '.ex_sc', '.exscore', '.correct_score'
                    ]
                    
                    for sel in selectors:
                        try:
                            els = row.find_elements(By.CSS_SELECTOR, sel)
                            if els:
                                texts = [e.text.strip() for e in els]
                                classes = [e.get_attribute('class') for e in els]
                                print(f"  {sel}: {texts} | classes: {classes}")
                        except Exception as e:
                            print(f"  {sel}: Error - {e}")
                    
                    # Also check inner HTML
                    print("\n--- Row innerHTML snippet ---")
                    html = row.get_attribute('innerHTML')[:2000]
                    print(html)
                    
                    break
            except:
                continue
                
    finally:
        driver.quit()

if __name__ == "__main__":
    debug_forebet_row()
