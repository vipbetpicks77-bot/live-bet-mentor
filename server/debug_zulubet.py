import sys
import os
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import undetected_chromedriver as uc

def debug_zulubet():
    print("Testing Zulubet structure...")
    options = uc.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = uc.Chrome(options=options)
    try:
        driver.get("https://www.zulubet.com/")
        print("Waiting for page load...")
        time.sleep(10)
        
        table = driver.find_element("css selector", "table.content_table")
        rows = table.find_elements("css selector", "tr")
        print(f"Found {len(rows)} rows")
        
        count = 0
        for i, row in enumerate(rows[:50]): # First 50 rows
            cells = row.find_elements("xpath", "./td")
            if len(cells) < 7:
                # print(f"Row {i} has only {len(cells)} cells")
                continue
                
            match_el = cells[1]
            txt = match_el.get_attribute("textContent").strip()
            
            # League info - try to get from title of flag img
            league = "Unknown"
            try:
                flag = match_el.find_element("css selector", "img.flags")
                league = flag.get_attribute("title")
            except: pass
            
            if " - " in txt:
                parts = txt.split(" - ")
                home = parts[0].strip().split('\n')[-1].strip()
                away = parts[1].strip().split('\n')[0].strip()
                
                tip = cells[6].get_attribute("textContent").strip()
                print(f"Match {i}: {home} vs {away} | League: {league} | Tip: '{tip}'")
                count += 1
        
        print(f"Total processed in sample: {count}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    debug_zulubet()
