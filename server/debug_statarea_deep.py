"""
Deep debug for Statarea - check actual .tip element content
"""
import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

def debug_statarea_deep():
    print("\n=== STATAREA DEEP DEBUG ===")
    options = uc.ChromeOptions()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    driver = uc.Chrome(options=options, headless=False)
    
    try:
        driver.get("https://www.statarea.com/predictions")
        time.sleep(15)
        
        # Handle consent if any
        try:
            consent_btns = driver.find_elements(By.CSS_SELECTOR, "button[aria-label='Consent'], .fc-cta-consent, button.accept")
            for btn in consent_btns:
                if btn.is_displayed():
                    btn.click()
                    print("[DEBUG] Consent clicked")
                    time.sleep(2)
                    break
        except: pass
        
        # Find cmatch elements
        cmatch_elements = driver.find_elements(By.CSS_SELECTOR, "div.cmatch")
        print(f"[DEBUG] Found {len(cmatch_elements)} cmatch elements")
        
        # Analyze first 5 cmatch elements in detail
        for i, match in enumerate(cmatch_elements[:5]):
            print(f"\n--- Match {i+1} ---")
            try:
                # Full HTML
                html = match.get_attribute("outerHTML")[:500]
                print(f"HTML: {html}")
                
                # Teams
                team_links = match.find_elements(By.CSS_SELECTOR, ".teams a")
                if team_links:
                    print(f"Teams: {[t.text for t in team_links]}")
                else:
                    teams_div = match.find_elements(By.CSS_SELECTOR, ".teams")
                    if teams_div:
                        print(f"Teams div text: {teams_div[0].text}")
                
                # Tip element - try multiple selectors
                tip_selectors = [".tip", ".tip .value", ".tip div", "div.tip", "[class*='tip']"]
                for sel in tip_selectors:
                    try:
                        tip_els = match.find_elements(By.CSS_SELECTOR, sel)
                        if tip_els:
                            for tip_el in tip_els:
                                txt = tip_el.text.strip()
                                inner = tip_el.get_attribute("innerHTML")[:100] if tip_el.get_attribute("innerHTML") else "none"
                                cls = tip_el.get_attribute("class")
                                print(f"  Selector '{sel}': text='{txt}', class='{cls}', innerHTML='{inner}'")
                    except: pass
                
                # Check for any div containing 1, 2, or X
                all_divs = match.find_elements(By.TAG_NAME, "div")
                for div in all_divs:
                    txt = div.text.strip()
                    if txt in ["1", "2", "X"]:
                        cls = div.get_attribute("class")
                        print(f"  FOUND TIP: text='{txt}', class='{cls}'")
                        
            except Exception as e:
                print(f"Error analyzing match: {e}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    debug_statarea_deep()
