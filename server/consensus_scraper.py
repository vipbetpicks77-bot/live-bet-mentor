import time
import json
import os
import sqlite3
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import undetected_chromedriver as uc

# CONFIG
SITES = {
    "forebet": "https://www.forebet.com/tr/futbol-tahminleri",
    "predictz": "https://www.predictz.com/predictions/today/",
    "windrawwin": "https://www.windrawwin.com/predictions/today/",
    "statarea": "https://www.statarea.com/predictions"
}

OUTPUT_FILE = "server/consensus_data.json"

class ConsensusScraper:
    def __init__(self):
        self.results = {}
        # Load existing data to avoid wiping out sources that haven't run yet
        if os.path.exists(OUTPUT_FILE):
            try:
                with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                    self.results = json.load(f)
                print(f"[CONSENSUS] Loaded {len(self.results)} existing sources")
            except:
                print("[CONSENSUS] Could not load existing data, starting fresh")

    def get_driver(self):
        options = uc.ChromeOptions()
        # Do not use --headless as a command line argument for UC
        # Use the headless parameter in uc.Chrome constructor instead
        
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        
        # More realistic User-Agent
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        options.add_argument(f"user-agent={ua}")
        
        driver = uc.Chrome(options=options, headless=True)
        return driver

    def save_results(self):
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=4)
        print(f"[CONSENSUS] Data saved to {OUTPUT_FILE}")

    def scrape_forebet(self):
        print("[CONSENSUS] Scraping Forebet...")
        driver = self.get_driver()
        try:
            url = SITES["forebet"]
            driver.get(url)
            time.sleep(25) # Extra wait for Cloudflare
            
            predictions = []
            # Forebet uses div.tr_0 and div.tr_1 or .rcnt
            rows = driver.find_elements("css selector", "div.tr_0, div.tr_1, .rcnt")
            print(f"[CONSENSUS] Forebet: Found {len(rows)} potential rows")
            
            if len(rows) == 0:
                driver.save_screenshot("forebet_empty.png")

            for row in rows:
                try:
                    home = row.find_element("css selector", "span.homeTeam").get_attribute("textContent").strip()
                    away = row.find_element("css selector", "span.awayTeam").get_attribute("textContent").strip()
                    
                    try:
                        # Improved URL selection - look for match link specifically
                        match_url = row.find_element("css selector", "a[href*='/matches/']").get_attribute("href")
                    except:
                        try:
                            match_url = row.find_element("css selector", "a").get_attribute("href")
                        except:
                            match_url = None

                    try:
                        pred = row.find_element("css selector", "div.predict span").get_attribute("textContent").strip()
                    except:
                        pred = "N/A"
                    
                    if home and away:
                        predictions.append({
                            "home": home, "away": away, "prediction": pred,
                            "url": match_url, "timestamp": datetime.now().isoformat()
                        })
                except: continue
            
            if predictions:
                self.results["forebet"] = predictions
            else:
                print("[CONSENSUS] Forebet: No new predictions found, keeping old ones.")
        except Exception as e: print(f"[CONSENSUS] Forebet error: {e}")
        finally: driver.quit()

    def scrape_predictz(self):
        print("[CONSENSUS] Scraping PredictZ...")
        driver = self.get_driver()
        try:
            url = SITES["predictz"]
            driver.get(url)
            time.sleep(15) # Wait for Cloudflare
            
            predictions = []
            rows = driver.find_elements("css selector", ".pttr.ptcnt")
            print(f"[CONSENSUS] PredictZ: Found {len(rows)} rows")
            
            for row in rows:
                try:
                    game_el = row.find_element("css selector", ".pttd.ptgame a")
                    match_name = game_el.text.strip()
                    if ' v ' not in match_name: continue
                    home, away = [t.strip() for t in match_name.split(' v ')]
                    
                    pred_el = row.find_element("css selector", ".pttd.ptprd")
                    pred_text = pred_el.get_attribute("textContent").strip()
                    pred = "N/A"
                    if "Home" in pred_text: pred = "1"
                    elif "Draw" in pred_text: pred = "X"
                    elif "Away" in pred_text: pred = "2"
                    
                    if home and away:
                        predictions.append({
                            "home": home, "away": away, "prediction": pred,
                            "timestamp": datetime.now().isoformat()
                        })
                except: continue
            
            if predictions:
                self.results["predictz"] = predictions
            else:
                print("[CONSENSUS] PredictZ: No new predictions found, keeping old ones.")
        except Exception as e: print(f"[CONSENSUS] PredictZ error: {e}")
        finally: driver.quit()

    def scrape_windrawwin(self):
        print("[CONSENSUS] Scraping WinDrawWin...")
        driver = self.get_driver()
        try:
            url = SITES["windrawwin"]
            driver.get(url)
            time.sleep(20) # More time
            
            predictions = []
            # WinDrawWin uses .wttr or .wttr.wtsml or table rows
            rows = driver.find_elements("css selector", "div.wttr")
            if not rows:
                rows = driver.find_elements("css selector", "tr.wttr")
            
            print(f"[CONSENSUS] WinDrawWin: Found {len(rows)} rows")
            
            for row in rows:
                try:
                    # Get match name
                    txt = row.get_attribute("textContent").strip()
                    # Example: "14:00 Melbourne Victory v Perth Glory 2-0 1 Home Win"
                    if ' v ' not in txt: continue
                    
                    # Try to separate by ' v '
                    parts = txt.split(' v ')
                    home = parts[0].strip().split('\n')[-1].strip()
                    rest = parts[1].strip()
                    away = rest.split('  ')[0].strip() # Usually double space after away team
                    
                    pred_type_el = row.find_element("css selector", ".wtprd")
                    pred_type = pred_type_el.text.strip()
                    pred = "N/A"
                    if "Home" in pred_type: pred = "1"
                    elif "Draw" in pred_type: pred = "X"
                    elif "Away" in pred_type: pred = "2"
                    
                    if home and away:
                        predictions.append({
                            "home": home, "away": away, "prediction": pred,
                            "timestamp": datetime.now().isoformat()
                        })
                except: continue
            
            if predictions:
                self.results["windrawwin"] = predictions
            else:
                print("[CONSENSUS] WinDrawWin: No new predictions found, keeping old ones.")
        except Exception as e: print(f"[CONSENSUS] WinDrawWin error: {e}")
        finally: driver.quit()

    def scrape_statarea(self):
        print("[CONSENSUS] Scraping Statarea...")
        driver = self.get_driver()
        try:
            url = SITES["statarea"]
            driver.get(url)
            time.sleep(10)
            predictions = []
            rows = driver.find_elements("css selector", "div.cmatch") # Verified in browser
            print(f"[CONSENSUS] Statarea: Found {len(rows)} potential match blocks")
            
            for row in rows:
                try:
                    # More robust team extraction
                    try:
                        home = row.find_element("css selector", "div.home").get_attribute("textContent").strip()
                        away = row.find_element("css selector", "div.away").get_attribute("textContent").strip()
                    except:
                        teams_el = row.find_element("css selector", "div.teams")
                        txt = teams_el.get_attribute("textContent").strip()
                        if " - " in txt:
                            home, away = txt.split(" - ", 1)
                        else: continue
                    
                    try:
                        tip_el = row.find_element("css selector", "div.tip")
                        tip_text = tip_el.get_attribute("textContent").strip()
                        if not tip_text:
                            tip_text = tip_el.find_element("css selector", "div.value").get_attribute("textContent").strip()
                        cls = tip_el.get_attribute("class")
                    except:
                        tip_text = ""
                        cls = ""
                    
                    pred = "N/A"
                    if "1" in tip_text or "tip1" in cls: pred = "1"
                    elif "X" in tip_text or "tipX" in cls or "0" in tip_text: pred = "X"
                    elif "2" in tip_text or "tip2" in cls: pred = "2"
                    
                    if home and away and pred != "N/A":
                        predictions.append({
                            "home": home.strip(), "away": away.strip(), "prediction": pred,
                            "timestamp": datetime.now().isoformat()
                        })
                except Exception as e:
                    continue
            self.results["statarea"] = predictions
        except Exception as e: print(f"[CONSENSUS] Statarea error: {e}")
        finally: driver.quit()

    def scrape_vitibet(self):
        print("[CONSENSUS] Scraping Vitibet...")
        driver = self.get_driver()
        try:
            url = "https://www.vitibet.com/index.php?clanek=quicktips&sekce=fotbal&lang=en"
            driver.get(url)
            time.sleep(10)
            predictions = []
            # Vitibet uses a standard table for quicktips
            # Vitibet uses a standard table for quicktips, but let's be more generic
            rows = driver.find_elements("css selector", "table tr")
            print(f"[CONSENSUS] Vitibet: Found {len(rows)} potential rows")
            
            for i, row in enumerate(rows):
                if i % 50 == 0: print(f"[CONSENSUS] Vitibet processing row {i}...")
                try:
                    cells = row.find_elements("xpath", "./td")
                    if len(cells) < 7: continue
                    # Index 2: Home, Index 3: Away, Index 6: Pred (1, 0, 2)
                    home = cells[2].get_attribute("textContent").strip()
                    away = cells[3].get_attribute("textContent").strip()
                    tip_raw = cells[6].get_attribute("textContent").strip()
                    
                    if not home or not away: continue
                    
                    pred = "N/A"
                    if tip_raw == "1": pred = "1"
                    elif tip_raw in ["0", "X", "0-0"]: pred = "X"
                    elif tip_raw == "2": pred = "2"
                    
                    if pred != "N/A":
                        predictions.append({
                            "home": home, "away": away, "prediction": pred,
                            "timestamp": datetime.now().isoformat()
                        })
                except: continue
            self.results["vitibet"] = predictions
        except Exception as e: print(f"[CONSENSUS] Vitibet error: {e}")
        finally: driver.quit()

    def scrape_zulubet(self):
        print("[CONSENSUS] Scraping Zulubet...")
        driver = self.get_driver()
        try:
            driver.get("https://www.zulubet.com/")
            time.sleep(10)
            predictions = []
            
            # Find the main table explicitly
            table = driver.find_element("css selector", "table.content_table")
            rows = table.find_elements("css selector", "tr")
            print(f"[CONSENSUS] Zulubet: Found {len(rows)} potential rows")
            
            for row in rows:
                try:
                    # Get only direct child TDs to avoid nested table confusion
                    cells = row.find_elements("xpath", "./td")
                    if len(cells) < 7: continue
                    
                    # Match name is usually in cell index 1
                    match_el = cells[1]
                    txt = match_el.get_attribute("textContent").strip()
                    if " - " not in txt: continue
                    
                    # Extract teams from the text, handling possible dates/leagues inside cell 1
                    # Usually: [League Icon] Home - Away
                    parts = txt.split(" - ")
                    if len(parts) >= 2:
                        home = parts[0].strip().split('\n')[-1].strip()
                        away = parts[1].strip().split('\n')[0].strip()
                        
                        # Tip is usually in index 6 for actual match rows
                        tip = cells[6].get_attribute("textContent").strip()
                        
                        # Sometimes index shifts if there's an extra column
                        if tip not in ["1", "X", "2"]:
                            # Look specifically for the tip span/b if possible, or try index 5
                            try:
                                tip_cand = row.find_element("css selector", "td:nth-child(7) b").text.strip()
                                if tip_cand in ["1", "X", "2"]: tip = tip_cand
                            except:
                                pass
                        
                        pred = "N/A"
                        if tip == "1": pred = "1"
                        elif tip == "X": pred = "X"
                        elif tip == "2": pred = "2"
                        
                        if home and away and pred != "N/A":
                            predictions.append({
                                "home": home, "away": away, "prediction": pred,
                                "timestamp": datetime.now().isoformat()
                            })
                except: continue
            self.results["zulubet"] = predictions
        except Exception as e: print(f"[CONSENSUS] Zulubet error: {e}")
        finally: driver.quit()

    def run_all(self):
        print(f"[CONSENSUS] Starting full run at {datetime.now().isoformat()}")
        # Execute sequentially with fresh drivers
        methods = [
            self.scrape_forebet, 
            self.scrape_predictz, 
            self.scrape_windrawwin,
            self.scrape_statarea,
            self.scrape_vitibet,
            self.scrape_zulubet
        ]
        
        for method in methods:
            try:
                method()
                self.save_results()
                time.sleep(5) # Cooldown between sites
            except Exception as e:
                print(f"[CONSENSUS] Method failed: {e}")

if __name__ == "__main__":
    scraper = ConsensusScraper()
    scraper.run_all()
