import time
import json
import os
import sqlite3
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import undetected_chromedriver as uc

# CONFIG
SITES = {
    "forebet": "https://m.forebet.com/en/football-tips-and-predictions-for-today",
    "predictz": "https://www.predictz.com/predictions/today/",
    "windrawwin": "https://www.windrawwin.com/predictions/today/",
    "statarea": "https://www.statarea.com/predictions",
    "prosoccer": "https://www.prosoccer.gr/en/football/predictions/"
}

OUTPUT_FILE = "server/consensus_data.json"

class ConsensusScraper:
    def __init__(self):
        self.results = {}
        # Load existing data to avoid wiping out sources that haven't run yet
        if os.path.exists(OUTPUT_FILE):
            try:
                with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                    raw_data = json.load(f)
                    # Migration: Convert old "prediction" format to new "markets" format
                    for site, matches in raw_data.items():
                        migrated_matches = []
                        for m in matches:
                            if "prediction" in m and "markets" not in m:
                                m["markets"] = {
                                    "1X2": {
                                        "pred": m.pop("prediction"),
                                        "prob": m.pop("probability", "0")
                                    }
                                }
                            migrated_matches.append(m)
                        self.results[site] = migrated_matches
                print(f"[CONSENSUS] Loaded and migrated {len(self.results)} sources")
            except Exception as e:
                print(f"[CONSENSUS] Could not load/migrate existing data: {e}")

    def get_driver(self, use_mobile=False, headless=True):
        options = uc.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-position=-2000,0') # Open off-screen
        
        if use_mobile:
            options.add_argument('--window-size=375,812')
        else:
            options.add_argument('--window-size=1920,1080')
        
        try:
            driver = uc.Chrome(options=options, headless=headless)
            if not headless:
                driver.minimize_window()
            return driver
        except Exception as e:
            print(f"[CONSENSUS] Driver failed: {e}")
            return uc.Chrome(headless=True)

    def save_results(self):
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=4)
        print(f"[CONSENSUS] Data saved to {OUTPUT_FILE}")

    def scrape_forebet(self):
        print("[CONSENSUS] Scraping Forebet (Full Market Support)...")
        driver = self.get_driver(use_mobile=True, headless=False)
        try:
            # Main Today Page
            url = "https://m.forebet.com/en/football-tips-and-predictions-for-today"
            driver.get(url)
            time.sleep(12) 
            
            predictions = []
            rows = driver.find_elements("css selector", ".rcnt")
            print(f"[CONSENSUS] Forebet: Found {len(rows)} matching rows")
            
            for row in rows:
                try:
                    home = row.find_element("css selector", ".homeTeam span").get_attribute("textContent").strip()
                    away = row.find_element("css selector", ".awayTeam span").get_attribute("textContent").strip()
                    
                    # League extraction
                    league = "Unknown"
                    try:
                        # On mobile, league name is often hidden in onclick of .flsc
                        league_img = row.find_element("css selector", ".flsc")
                        onclick_attr = league_img.get_attribute("onclick")
                        if onclick_attr and "getstag" in onclick_attr:
                            # getstag(this, ID, 'Country', 'League', 'URL', 'Code')
                            # Example: getstag(this, 1234, 'England', 'Premier League', ...)
                            match = re.search(r"getstag\(.*?,\s*.*?,\s*'(.*?)',\s*'(.*?)'", onclick_attr)
                            if match:
                                country = match.group(1)
                                comp = match.group(2)
                                league = f"{country} {comp}".strip()
                        
                        if league == "Unknown":
                            # Fallback to title/alt or .shortTag
                            league = league_img.get_attribute("title") or league_img.get_attribute("alt")
                            if not league:
                                try:
                                    league = row.find_element("css selector", ".shortTag").text.strip()
                                except: pass
                            if not league: league = "Unknown"
                            
                        # Double-check league name for script junk
                        if league and ("adsbygoogle" in league or "{" in league):
                            league = "Unknown"
                    except: pass

                    # 1X2 Prediction & Main Prob
                    tip_1x2 = row.find_element("css selector", ".forepr span, .fpr span, .forepr").get_attribute("textContent").strip()
                    prob_1x2 = "0"
                    try:
                        prob_1x2 = row.find_element("css selector", ".fprc span.fpr").get_attribute("textContent").strip()
                    except: pass

                    # Initialize match object with multiple markets
                    match_obj = {
                        "home": home, "away": away,
                        "league": league,
                        "timestamp": datetime.now().isoformat(),
                        "markets": {
                            "1X2": {"pred": tip_1x2, "prob": prob_1x2}
                        }
                    }

                    # Forebet often shows OU and BTTS probabilities as small bar/colors or mini icons
                    # We focus on the most reliable 1X2 for now, but mark it for future sub-page scraping if needed
                    
                    if home and away:
                        # Date and Time extraction (e.g. 02/01/2026 18:00)
                        try:
                            time_text = row.find_element("css selector", "time span").get_attribute("textContent").strip()
                            # Date: DD/MM
                            m_date = re.search(r'(\d{2})/(\d{2})', time_text)
                            match_obj["date"] = f"{m_date.group(1)}.{m_date.group(2)}" if m_date else datetime.now().strftime("%d.%m")
                            
                            # Time: HH:MM
                            m_time = re.search(r'(\d{2}:\d{2})', time_text)
                            if m_time: match_obj["time"] = m_time.group(1)
                        except:
                            match_obj["date"] = datetime.now().strftime("%d.%m")
                        
                        predictions.append(match_obj)
                except: continue
            
            if predictions:
                self.results["forebet"] = predictions
            else:
                 print("[CONSENSUS] Forebet: No predictions found.")
        except Exception as e: print(f"[CONSENSUS] Forebet error: {e}")
        finally: driver.quit()

    def scrape_prosoccer(self):
        print("[CONSENSUS] Scraping ProSoccer.gr...")
        driver = self.get_driver(use_mobile=False)
        try:
            driver.get(SITES["prosoccer"])
            time.sleep(10) # Wait for DataTables initialization
            
            predictions = []
            # ProSoccer rows are in #tblPredictions
            rows = driver.find_elements("css selector", "#tblPredictions tbody tr")
            print(f"[CONSENSUS] ProSoccer: Found {len(rows)} rows")
            
            for row in rows:
                try:
                    cells = row.find_elements("xpath", "./td")
                    if len(cells) < 14: continue
                    
                    # Teams: index 2 (td.mio.fc1)
                    teams_text = cells[2].get_attribute("textContent").strip().replace('\xa0', ' ')
                    if " - " not in teams_text: continue
                    home, away = teams_text.split(" - ", 1)
                    
                    # 1 X 2 Tip (cells[6])
                    raw_tip = cells[6].get_attribute("textContent").strip().lower()
                    tip_1x2 = "N/A"
                    if "a1" == raw_tip: tip_1x2 = "1"
                    elif "ax" == raw_tip: tip_1x2 = "X"
                    elif "a2" == raw_tip: tip_1x2 = "2"
                    elif "a1x" == raw_tip: tip_1x2 = "1X"
                    elif "ax2" == raw_tip: tip_1x2 = "X2"
                    elif "a12" == raw_tip: tip_1x2 = "12"
                    
                    # OU 2.5 (Under: cells[12], Over: cells[13])
                    try:
                        under_prob = int(cells[12].get_attribute("textContent").strip())
                        over_prob = int(cells[13].get_attribute("textContent").strip())
                        tip_ou = "OVER" if over_prob > under_prob else "UNDER"
                    except:
                        tip_ou = "N/A"
                    
                    m_time = ""
                    try:
                        # Try finding by class fc7 which often contains the time
                        time_el = row.find_element("css selector", "td.fc7")
                        m_time = time_el.get_attribute("textContent").strip()
                    except:
                        # Fallback to regex on first few cells
                        for cell in cells[:3]:
                            txt = cell.get_attribute("textContent").strip()
                            t_match = re.search(r'(\d{2}:\d{2})', txt)
                            if t_match:
                                m_time = t_match.group(1)
                                break

                    match_obj = {
                        "home": home.strip(), "away": away.strip(),
                        "timestamp": datetime.now().isoformat(),
                        "markets": {
                            "1X2": {"pred": tip_1x2, "prob": "0"},
                            "OU25": {"pred": tip_ou}
                        },
                        "date": datetime.now().strftime("%d.%m"),
                        "time": m_time
                    }
                    
                    predictions.append(match_obj)
                except: continue
                
            if predictions: 
                self.results["prosoccer"] = predictions
                print(f"[CONSENSUS] ProSoccer: Scraped {len(predictions)} matches")
        except Exception as e: 
            print(f"[CONSENSUS] ProSoccer error: {e}")
        finally: 
            driver.quit()

    def scrape_predictz(self):
        print("[CONSENSUS] Scraping PredictZ (Non-Headless)...")
        driver = self.get_driver(use_mobile=True, headless=False)
        try:
            url = SITES["predictz"]
            driver.get(url)
            time.sleep(15)
            
            driver.save_screenshot("server/predictz_debug.png")
            
            # Consent (Çerez Onayı) butonu kontrolü
            try:
                consent = driver.find_element("css selector", "button[aria-label='Consent'], .fc-cta-consent, .qc-cmp2-footer button")
                consent.click()
                time.sleep(2)
            except: pass
            
            predictions = []
            # Predictz satırları için daha esnek seçiciler
            rows = driver.find_elements("css selector", ".pttr, .pt-prediction-row, tr[class*='pttr'], [class*='prediction-container']")
            print(f"[CONSENSUS] PredictZ: Found {len(rows)} rows")
            
            for row in rows:
                try:
                    # League extraction (find preceding league header)
                    league = "Unknown"
                    try:
                        # Find the preceding sibling header or parent container header
                        league_el = row.find_element("xpath", "./preceding-sibling::div[contains(@class, 'ptlg') or contains(@class, 'pttd')][1]//h2")
                        league = league_el.text.strip().replace(" Tips", "")
                    except: 
                        # Fallback: maybe it's inside the row or we need a broader search
                        try:
                            league = driver.execute_script("return arguments[0].previousElementSibling.innerText;", row)
                            if "adsbygoogle" in league or "function" in league or "{" in league:
                                league = "Unknown"
                        except: pass
                    
                    # PredictZ yeni seçiciler (Sub-agent: .pttd.ptgame a)
                    home_away = row.find_element("css selector", ".pttd.ptgame a, .ptgame").get_attribute("textContent").strip()
                    if ' v ' in home_away:
                        home, away = home_away.split(' v ')
                    elif ' - ' in home_away:
                        home, away = home_away.split(' - ')
                    else: continue
                    
                    # Prediction Score (PredictZ usually has a score prediction)
                    # Sub-agent: .ptpredboxsml often contains score like "2-1" or "1"
                    pred_el = row.find_element("css selector", ".ptpredboxsml, .ptprd")
                    pred_text = pred_el.get_attribute("textContent").strip().lower()
                    
                    score_match = re.search(r'(\d+)-(\d+)', pred_text)
                    pred = "N/A"
                    markets = {}
                    
                    if score_match:
                        h_score = int(score_match.group(1))
                        a_score = int(score_match.group(2))
                        # Inferred Markets
                        markets["BTTS"] = {"pred": "Yes" if h_score > 0 and a_score > 0 else "No"}
                        markets["OU25"] = {"pred": "OVER" if (h_score + a_score) > 2.5 else "UNDER"}
                        # Determine 1X2 from score
                        if h_score > a_score: pred = "1"
                        elif h_score < a_score: pred = "2"
                        else: pred = "X"
                    else:
                        if "home" in pred_text or pred_text.startswith("1"): pred = "1"
                        elif "draw" in pred_text or "x" in pred_text: pred = "X"
                        elif "away" in pred_text or pred_text.startswith("2"): pred = "2"
                    
                    markets["1X2"] = {"pred": pred}
                    
                    if home and away:
                        predictions.append({
                            "home": home.strip(), "away": away.strip(), 
                            "league": league, # Added league
                            "markets": markets,
                            "timestamp": datetime.now().isoformat(),
                            "date": datetime.now().strftime("%d.%m")
                        })
                except: continue
            
            if predictions:
                self.results["predictz"] = predictions
            else:
                print("[CONSENSUS] PredictZ: No new predictions found, keeping old ones.")
        except Exception as e: print(f"[CONSENSUS] PredictZ error: {e}")
        finally: driver.quit()

    def scrape_windrawwin(self):
        print("[CONSENSUS] Scraping WinDrawWin (Non-Headless)...")
        driver = self.get_driver(use_mobile=False, headless=False)
        try:
            # Önce ana sayfaya git, sonra tahminlere
            driver.get("https://www.windrawwin.com/")
            time.sleep(5)
            # Go to kick-off time page to get times
            url = "https://www.windrawwin.com/predictions/today/kick-off-time/"
            driver.get(url)
            time.sleep(15)
            
            driver.save_screenshot("server/windrawwin_debug.png")
            
            predictions = []
            # WinDrawWin ana tahmin tablosundaki satırları bul
            rows = driver.find_elements("css selector", ".wttr, [class*='wttr'], tr[class*='wttr']")
            print(f"[CONSENSUS] WinDrawWin: Found {len(rows)} rows")
            
            for row in rows:
                try:
                    # League extraction
                    league = "Unknown"
                    try:
                        league_el = row.find_element("xpath", "./preceding-sibling::div[contains(@class, 'wtlg') or contains(@class, 'wtfixt')][1]")
                        league = league_el.text.strip().split('\n')[0].replace(" Predictions", "")
                    except: pass

                    # WinDrawWin: Updated selectors based on sub-agent scan
                    # Match name is usually in .wtdesklnk or .wtfixt a
                    match_el = None
                    for selector in [".wtdesklnk", ".wtfixt a", ".wtmoblnk"]:
                        try:
                            match_el = row.find_element("css selector", selector)
                            if match_el: break
                        except: continue
                    
                    if not match_el: continue
                    match_name = match_el.text.strip()
                    if ' v ' not in match_name: continue
                    home, away = match_name.split(' v ')
                    
                    # Predictions Score: .wtprd or last cell
                    pred_el = row.find_element("css selector", ".wtprd")
                    pred_text = pred_el.text.strip().lower() # e.g. "home win 2-1"
                    
                    score_match = re.search(r'(\d+)-(\d+)', pred_text)
                    pred = "N/A"
                    markets = {}
                    
                    if score_match:
                        h_score = int(score_match.group(1))
                        a_score = int(score_match.group(2))
                        markets["BTTS"] = {"pred": "Yes" if h_score > 0 and a_score > 0 else "No"}
                        markets["OU25"] = {"pred": "OVER" if (h_score + a_score) > 2.5 else "UNDER"}
                        if h_score > a_score: pred = "1"
                        elif h_score < a_score: pred = "2"
                        else: pred = "X"
                    else:
                        if "home" in pred_text: pred = "1"
                        elif "draw" in pred_text: pred = "X"
                        elif "away" in pred_text: pred = "2"
                    
                    markets["1X2"] = {"pred": pred}
                    
                    if home and away and pred != "N/A":
                        m_time = ""
                        try:
                            # Time is often in a separate div or before/after in parent
                            # In kick-off page, it might be in .wtfixt or similar
                            time_match = re.search(r'(\d{2}:\d{2})', row.text)
                            if time_match: m_time = time_match.group(1)
                        except: pass

                        predictions.append({
                            "home": home.strip(), "away": away.strip(), 
                            "league": league,
                            "markets": markets,
                            "timestamp": datetime.now().isoformat(),
                            "date": datetime.now().strftime("%d.%m"),
                            "time": m_time
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
            time.sleep(15)
            # Statarea ana sayfada tahminleri göstermezse "Day" seçeneğine bak
            try:
                # Bugünün tahminleri için butona bas
                day_btn = driver.find_element("css selector", "a[href*='/predictions/day/0']")
                day_btn.click()
                time.sleep(5)
            except: pass
            
            predictions = []
            # Statarea için güncel (2025/2026) seçiciler
            rows = driver.find_elements("css selector", "div.cmatch, .match-container, div[class*='match']")
            print(f"[CONSENSUS] Statarea: Found {len(rows)} potential match blocks")
            
            for row in rows:
                try:
                    # Takım isimleri
                    teams = row.find_elements("css selector", ".home, .away, .team")
                    if len(teams) >= 2:
                        home = teams[0].text.strip()
                        away = teams[1].text.strip()
                    else:
                        txt = row.get_attribute("textContent").strip().split('\n')[0]
                        if ' - ' in txt: home, away = txt.split(' - ', 1)
                        else:
                            # Try home/away search in sub-elements
                            try:
                                home = row.find_element(By.CSS_SELECTOR, ".home, .team:nth-child(1)").text.strip()
                                away = row.find_element(By.CSS_SELECTOR, ".away, .team:nth-child(2)").text.strip()
                            except: continue
                    
                    # Tahmin (Tip)
                    try:
                        tip_el = row.find_element("css selector", ".tip, .prediction, [class*='tip']")
                        tip_text = tip_el.text.strip().upper()
                        pred = "N/A"
                        if "1" in tip_text: pred = "1"
                        elif "X" in tip_text or "0" in tip_text: pred = "X"
                        elif "2" in tip_text: pred = "2"
                    except: pred = "N/A"
                    
                    if home and away and pred != "N/A":
                        m_time = ""
                        try:
                            m_time = row.find_element("css selector", "div.time").text.strip()
                        except: pass
                        
                        predictions.append({
                            "home": home, "away": away, 
                            "date": datetime.now().strftime("%d.%m"),
                            "time": m_time,
                            "markets": {
                                "1X2": {"pred": pred}
                            },
                            "timestamp": datetime.now().isoformat()
                        })
                except: continue
            
            if predictions:
                self.results["statarea"] = predictions
            else:
                 print("[CONSENSUS] Statarea: No new predictions found, keeping old ones.")
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
            rows = driver.find_elements("css selector", "table tr")
            print(f"[CONSENSUS] Vitibet: Found {len(rows)} potential rows")
            
            current_league = "Unknown"
            for i, row in enumerate(rows):
                try:
                    # Check for league header
                    row_class = row.get_attribute("class") or ""
                    if "odseknutiligy" in row_class:
                        try:
                            # Try to get text from <a> or directly from the row
                            header_a = row.find_elements("css selector", "a")
                            temp_league = ""
                            if header_a:
                                temp_league = header_a[0].get_attribute("textContent").strip()
                            
                            if not temp_league:
                                temp_league = row.get_attribute("textContent").strip()
                            
                            if temp_league:
                                # Clean up league name (remove counts like (12))
                                current_league = re.sub(r'\s*\(\d+\)$', '', temp_league).strip()
                            continue
                        except: pass

                    cells = row.find_elements("xpath", "./td")
                    if len(cells) < 12: continue
                    
                    # Tarih deseni kontrolü (Satırın maç satırı olduğundan emin olmak için)
                    date_text = cells[0].get_attribute("textContent").strip()
                    if not re.match(r"^\d{2}\.\d{2}$", date_text): continue
                    
                    home = cells[2].get_attribute("textContent").strip()
                    away = cells[3].get_attribute("textContent").strip()
                    league = current_league # Use sticky league
                    
                    # Score Inference
                    score_h = cells[5].get_attribute("textContent").strip()
                    score_a = cells[7].get_attribute("textContent").strip()
                    
                    markets = {}
                    if score_h.isdigit() and score_a.isdigit():
                        h_val = int(score_h)
                        a_val = int(score_a)
                        markets["BTTS"] = {"pred": "Yes" if h_val > 0 and a_val > 0 else "No"}
                        markets["OU25"] = {"pred": "OVER" if (h_val + a_val) > 2.5 else "UNDER"}
                    
                    tip_raw = cells[11].get_attribute("textContent").strip()
                    if not home or not away or not tip_raw: continue
                    
                    pred = "N/A"
                    if tip_raw in ["1", "10", "1X"]: pred = "1"
                    elif tip_raw in ["0", "X", "0-0", "0X", "X0"]: pred = "X"
                    elif tip_raw in ["2", "02", "X2"]: pred = "2"
                    
                    if pred != "N/A":
                        markets["1X2"] = {"pred": pred}
                        predictions.append({
                            "home": home, "away": away, 
                            "league": league, # Added league
                            "date": date_text,
                            "markets": markets,
                            "timestamp": datetime.now().isoformat()
                        })
                except: continue
            
            if predictions:
                self.results["vitibet"] = predictions
            else:
                print("[CONSENSUS] Vitibet: No new predictions found, keeping old ones.")
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
                    
                    # League info - try to get from title of flag img in cell 1
                    league = "Unknown"
                    try:
                        flag = match_el.find_element("css selector", "img.flags")
                        league = flag.get_attribute("title") or flag.get_attribute("alt") or "Unknown"
                    except: pass
                    
                    # Extract teams from the text
                    parts = txt.split(" - ")
                    if len(parts) >= 2:
                        home = parts[0].strip().split('\n')[-1].strip()
                        away = parts[1].strip().split('\n')[0].strip()
                        
                        # Tip is in index 6
                        tip = cells[6].get_attribute("textContent").strip()
                        
                        # Double chance support: 1X, X2, 12
                        pred = "N/A"
                        if tip in ["1", "X", "2", "1X", "X2", "12"]:
                            pred = tip
                        
                        if home and away and pred != "N/A":
                            m_date = datetime.now().strftime("%d.%m")
                            m_time = ""
                            try:
                                # cells[0] usually: "02-01, 14:00"
                                time_txt = cells[0].get_attribute("textContent").strip()
                                t_match = re.search(r'(\d{2}:\d{2})', time_txt)
                                if t_match: m_time = t_match.group(1)
                            except: pass

                            predictions.append({
                                "home": home, "away": away, 
                                "league": league,
                                "date": m_date,
                                "time": m_time,
                                "markets": {
                                    "1X2": {"pred": pred}
                                },
                                "timestamp": datetime.now().isoformat()
                            })
                except: continue
            self.results["zulubet"] = predictions
        except Exception as e: print(f"[CONSENSUS] Zulubet error: {e}")
        finally: driver.quit()

    def scrape_olbg(self):
        print("[CONSENSUS] Scraping OLBG (Global Popular Bets)...")
        driver = self.get_driver()
        try:
            driver.get("https://www.olbg.com/betting-tips/Football/1")
            # Wait for the list to load
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "li:has(h5)"))
            )
            time.sleep(5)
            
            predictions = []
            rows = driver.find_elements(By.CSS_SELECTOR, "li:has(h5)")
            print(f"[CONSENSUS] OLBG: Found {len(rows)} potential rows")
            
            for row in rows:
                try:
                    # Teams: "Home v Away"
                    teams_el = row.find_element(By.CSS_SELECTOR, ".rw.ev h5")
                    teams_text = teams_el.get_attribute("textContent").strip()
                    if " v " not in teams_text: continue
                    
                    home_away = teams_text.split(" v ")
                    home = home_away[0].strip()
                    away = home_away[1].strip()
                    
                    # League
                    league = "Unknown"
                    try:
                        league_el = row.find_element(By.CSS_SELECTOR, ".rw.ev p.text-sm")
                        league = league_el.get_attribute("textContent").strip()
                    except: pass

                    # Date and Time extraction
                    m_date = datetime.now().strftime("%d.%m")
                    m_time = ""
                    try:
                        # OLBG uses <time itemprop="startDate" datetime="...">
                        time_el = row.find_element(By.CSS_SELECTOR, "time")
                        iso_date = time_el.get_attribute("datetime")
                        raw_time_text = time_el.get_attribute("textContent").strip()
                        
                        if iso_date:
                            try:
                                dt_obj = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
                                m_date = dt_obj.strftime("%d.%m")
                                m_time = dt_obj.strftime("%H:%M")
                            except: pass
                        
                        # Fallback/Override: If time is still missing or we want to be sure
                        if not m_time or m_time == "00:00":
                            time_match = re.search(r'(\d{1,2}[:.]\d{2})', raw_time_text)
                            if time_match:
                                m_time = time_match.group(1).replace('.', ':')
                                # Ensure 0 prefix if needed (e.g. 8:35 -> 08:35)
                                if len(m_time.split(':')[0]) == 1:
                                    m_time = "0" + m_time

                        # Date fallback
                        if "Tomorrow" in raw_time_text:
                            m_date = (datetime.now() + timedelta(days=1)).strftime("%d.%m")
                        elif "Today" in raw_time_text:
                            m_date = datetime.now().strftime("%d.%m")
                        elif not iso_date:
                            # Look for "DD Mon" pattern
                            date_match = re.search(r'(\d{2})\s+([A-Za-z]{3})', raw_time_text)
                            if date_match:
                                day = date_match.group(1)
                                m_date = f"{day}.{datetime.now().strftime('%m')}"
                    except: pass
                    
                    # Consensus % and Tip Count
                    prob = "0"
                    tip_count = ""
                    try:
                        tips_container = row.find_element(By.CSS_SELECTOR, ".rw.tips")
                        
                        # Percentage
                        try:
                            prob_el = tips_container.find_element(By.CSS_SELECTOR, "span")
                            prob_txt = prob_el.get_attribute("textContent").strip()
                            prob_match = re.search(r'(\d+)%', prob_txt)
                            if prob_match: prob = prob_match.group(1)
                        except: pass
                            
                        # Tip Count (e.g. "52/62 Win Tips")
                        try:
                            tip_count_el = tips_container.find_element(By.CSS_SELECTOR, "b")
                            tip_count_txt = tip_count_el.get_attribute("textContent").strip()
                            tc_match = re.search(r'(\d+/\d+)', tip_count_txt)
                            if tc_match: tip_count = tc_match.group(1)
                        except: pass
                    except: pass
                    
                    # Selection (Tip)
                    selection = "Unknown"
                    try:
                        selection_el = row.find_element(By.CSS_SELECTOR, ".rw.sel h4")
                        selection = selection_el.get_attribute("textContent").strip()
                    except: pass
                    
                    # Market Name
                    market_name = "1X2" # Default
                    try:
                        market_el = row.find_element(By.CSS_SELECTOR, ".rw.sel p.truncate")
                        m_txt = market_el.get_attribute("textContent").lower()
                        if "both teams to score" in m_txt: market_name = "BTTS"
                        elif "over/under" in m_txt: market_name = "OU25"
                    except: pass
                    
                    # Map selection to our format
                    pred = selection
                    if market_name == "1X2":
                        if selection == home: pred = "1"
                        elif selection == away: pred = "2"
                        elif "draw" in selection.lower(): pred = "X"
                    elif market_name == "BTTS":
                        pred = "Yes" if "yes" in selection.lower() else "No"
                    elif market_name == "OU25":
                        pred = "OVER" if "over" in selection.lower() else "UNDER"
                        
                    predictions.append({
                        "home": home,
                        "away": away,
                        "league": league,
                        "date": m_date,
                        "time": m_time,
                        "markets": {
                            market_name: {
                                "pred": pred,
                                "prob": prob,
                                "tip_count": tip_count
                            }
                        },
                        "timestamp": datetime.now().isoformat()
                    })
                except:
                    continue
                    
            self.results["olbg"] = predictions
            print(f"[CONSENSUS] OLBG: Scraped {len(predictions)} predictions")
        except Exception as e:
            print(f"[CONSENSUS] OLBG error: {e}")
        finally:
            driver.quit()

    def run_all(self):
        print(f"[CONSENSUS] Starting full run at {datetime.now().isoformat()}")
        # Execute sequentially with fresh drivers
        methods = [
            self.scrape_forebet, 
            self.scrape_prosoccer,
            self.scrape_predictz, 
            self.scrape_windrawwin,
            self.scrape_statarea,
            self.scrape_vitibet,
            self.scrape_zulubet,
            self.scrape_olbg
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
