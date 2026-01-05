"""
OddsPortal Debug Script - Analyze page structure for scraping
"""
import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

def debug_oddsportal():
    print("\n=== ODDSPORTAL DEBUG ===")
    options = uc.ChromeOptions()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    
    # More stealth settings
    options.add_argument('--disable-blink-features=AutomationControlled')
    
    driver = uc.Chrome(options=options, headless=False)
    
    try:
        # OddsPortal main page for today's matches
        url = "https://www.oddsportal.com/matches/football/"
        print(f"[DEBUG] Navigating to: {url}")
        driver.get(url)
        
        # Wait longer for Cloudflare check
        print("[DEBUG] Waiting 20s for Cloudflare...")
        time.sleep(20)
        
        # Take screenshot
        driver.save_screenshot("server/oddsportal_debug.png")
        print("[DEBUG] Screenshot saved")
        
        # Try to find matches
        selectors_to_try = [
            ".eventRow",
            ".event-row",
            "tr.deactivate",
            "[class*='event']",
            ".table-main tbody tr",
            "div[class*='flex'][class*='gap']",
            "[data-test='event-row']"
        ]
        
        for sel in selectors_to_try:
            try:
                els = driver.find_elements(By.CSS_SELECTOR, sel)
                if els:
                    print(f"  ✓ {sel}: {len(els)} elements")
                    if len(els) > 0:
                        # Print first element details
                        html = els[0].get_attribute("outerHTML")[:300]
                        print(f"    Sample: {html}")
            except Exception as e:
                print(f"  ✗ {sel}: {e}")
        
        # Print page title and body preview
        print(f"\n[DEBUG] Page Title: {driver.title}")
        body_text = driver.find_element(By.TAG_NAME, "body").text[:1500]
        print(f"\n[DEBUG] Body Preview:\n{body_text[:1500]}")
        
        # Check for Cloudflare block
        if "Just a moment" in driver.page_source or "Checking your browser" in driver.page_source:
            print("\n⚠️ CLOUDFLARE BLOCK DETECTED!")
        
    except Exception as e:
        print(f"[DEBUG] Error: {e}")
    finally:
        input("\nPress Enter to close browser...")
        driver.quit()

if __name__ == "__main__":
    debug_oddsportal()
