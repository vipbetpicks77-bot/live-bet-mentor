"""
Debug script for WinDrawWin, PredictZ and Statarea selectors
"""
import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

def get_driver():
    options = uc.ChromeOptions()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    driver = uc.Chrome(options=options, headless=False)
    return driver

def debug_windrawwin():
    print("\n=== WINDRAWWIN DEBUG ===")
    driver = get_driver()
    try:
        driver.get("https://www.windrawwin.com/predictions/today/")
        time.sleep(10)
        driver.save_screenshot("server/wdw_debug.png")
        
        # Test various selectors
        selectors_to_test = [
            ".wttr",
            "tr.wttr",
            ".wt-match",
            ".wt-pred", 
            ".wtable tr",
            "table.wttable tr",
            ".match-row",
            "div.match",
            ".prediction-row"
        ]
        
        for sel in selectors_to_test:
            try:
                els = driver.find_elements(By.CSS_SELECTOR, sel)
                if len(els) > 0:
                    print(f"  ✓ {sel}: {len(els)} elements found")
                    if len(els) <= 3:
                        for el in els:
                            print(f"    - Text: {el.text[:100]}...")
            except Exception as e:
                print(f"  ✗ {sel}: Error - {e}")
        
        # Get all table rows and analyze
        print("\n  Analyzing all TR elements...")
        all_trs = driver.find_elements(By.TAG_NAME, "tr")
        print(f"  Total TR elements: {len(all_trs)}")
        
        # Sample first 5 TRs with class attributes
        for i, tr in enumerate(all_trs[:10]):
            cls = tr.get_attribute("class") or "no-class"
            text = tr.text[:80].replace('\n', ' ') if tr.text else "empty"
            print(f"  TR[{i}] class='{cls}' text='{text}'")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

def debug_predictz():
    print("\n=== PREDICTZ DEBUG ===")
    driver = get_driver()
    try:
        driver.get("https://www.predictz.com/predictions/today/")
        time.sleep(15)
        driver.save_screenshot("server/predictz_debug.png")
        
        selectors_to_test = [
            ".pttr",
            "tr.pttr",
            ".pttd",
            ".ptgame",
            ".predbox",
            ".match",
            "table tr",
            ".fixture"
        ]
        
        for sel in selectors_to_test:
            try:
                els = driver.find_elements(By.CSS_SELECTOR, sel)
                if len(els) > 0:
                    print(f"  ✓ {sel}: {len(els)} elements found")
            except Exception as e:
                print(f"  ✗ {sel}: Error")
        
        # Check if page actually loaded
        body_text = driver.find_element(By.TAG_NAME, "body").text[:500]
        print(f"\n  First 500 chars of body: {body_text}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

def debug_statarea():
    print("\n=== STATAREA DEBUG ===")
    driver = get_driver()
    try:
        driver.get("https://www.statarea.com/predictions")
        time.sleep(10)
        driver.save_screenshot("server/statarea_debug.png")
        
        selectors_to_test = [
            ".cmatch",
            "div.cmatch",
            ".match",
            ".home",
            ".away",
            ".tip",
            ".prediction",
            "[class*='match']",
            "[class*='game']"
        ]
        
        for sel in selectors_to_test:
            try:
                els = driver.find_elements(By.CSS_SELECTOR, sel)
                if len(els) > 0:
                    print(f"  ✓ {sel}: {len(els)} elements found")
                    if sel == ".cmatch" and len(els) > 0:
                        # Analyze first match block
                        first = els[0]
                        print(f"    First cmatch HTML: {first.get_attribute('outerHTML')[:300]}...")
            except Exception as e:
                print(f"  ✗ {sel}: Error")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        site = sys.argv[1].lower()
        if site == "wdw":
            debug_windrawwin()
        elif site == "predictz":
            debug_predictz()
        elif site == "statarea":
            debug_statarea()
    else:
        debug_windrawwin()
        debug_predictz()
        debug_statarea()
