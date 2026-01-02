import undetected_chromedriver as uc
import time
import os

def debug_forebet():
    options = uc.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    
    try:
        driver = uc.Chrome(options=options)
        url = "https://www.forebet.com/en/football-tips-and-predictions-for-today"
        print(f"Navigating to {url}...")
        driver.get(url)
        time.sleep(15)
        
        # Save screenshot and source
        driver.save_screenshot("server/forebet_en_debug.png")
        source = driver.page_source
        with open("server/forebet_en_source.html", "w", encoding="utf-8") as f:
            f.write(source)
        
        print(f"Done. Source length: {len(source)}")
        if "prediction" in source.lower():
            print("Found 'prediction' in source!")
        else:
            print("Could NOT find 'prediction' in source.")
            
        driver.quit()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_forebet()
