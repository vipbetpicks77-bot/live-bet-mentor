import undetected_chromedriver as uc
import time
import os

def debug_non_headless():
    options = uc.ChromeOptions()
    # options.add_argument('--headless') # REMOVED for testing
    options.add_argument('--no-sandbox')
    
    try:
        print("Launching non-headless browser...")
        driver = uc.Chrome(options=options)
        url = "https://m.forebet.com/en/football-tips-and-predictions-for-today"
        print(f"Navigating to {url}...")
        driver.get(url)
        time.sleep(20)
        
        driver.save_screenshot("server/forebet_non_headless_debug.png")
        source = driver.page_source
        
        rows = driver.find_elements("css selector", ".rcnt")
        print(f"Found {len(rows)} rows in non-headless mode.")
        
        driver.quit()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_non_headless()
