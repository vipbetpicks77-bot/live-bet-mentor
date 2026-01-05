import time
import json
import os
import logging
import requests
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

# Centralized Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("server/scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
DATA_FILE = 'server/sofascore_live.json'
NETWORK_LOG_FILE = 'server/network_log.txt'
STATS_DIR = 'server/stats'
LIVE_FETCH_INTERVAL = 15  # Fetch live list every 15 seconds for fresher data

# Configure performance logging
caps = DesiredCapabilities.CHROME
caps['goog:loggingPrefs'] = {'performance': 'ALL'}

def fetch_live_list_directly():
    """Fallback: Fetch live list directly via HTTP when network capture fails."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.sofascore.com/',
            'Origin': 'https://www.sofascore.com'
        }
        url = f'https://www.sofascore.com/api/v1/sport/football/events/live?_={int(time.time())}'
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'events' in data:
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f)
                
                # Firebase Upload
                try:
                    from firebase_uploader import upload_to_firebase
                    upload_to_firebase("live_events", data)
                except:
                    pass

                logger.info(f"[DIRECT] Captured LIVE_LIST via HTTP -> {DATA_FILE}")
                return True
    except Exception as e:
        logger.warning(f"[DIRECT] HTTP fallback failed: {e}")
    return False

def get_scraper():
    options = uc.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    
    logger.info("Launching undetected-chromedriver...")
    driver = uc.Chrome(options=options, desired_capabilities=caps)
    return driver

def capture_sofascore():
    driver = None
    try:
        driver = get_scraper()
        url = "https://www.sofascore.com/"
        print(f"[SCRAPER] Navigating to {url}...")
        driver.get(url)
        time.sleep(15)
        last_live_fetch = 0
        last_page_refresh = time.time()

        while True:
            # Check for generic event fetch requests or specific detail requests
            logs = driver.get_log('performance')
            
            for entry in logs:
                try:
                    message = json.loads(entry['message'])['message']
                    method = message.get('method')
                    
                    if method == 'Network.responseReceived':
                        params = message.get('params', {})
                        response = params.get('response', {})
                        request_url = response.get('url', '')
                        
                        # Use a broader match to capture EVERYTHING from SofaScore API
                        if "api/v1" in request_url and "sofascore" in request_url:
                            request_id = params['requestId']
                            
                            # Determine type of data
                            if "sport/football/events/live" in request_url:
                                type_label = "LIVE_LIST"
                                target_path = DATA_FILE
                            elif "/statistics" in request_url:
                                type_label = "STATS"
                                match_id = request_url.split('/')[-2]
                                target_path = os.path.join(STATS_DIR, f"{match_id}_stats.json")
                            elif "/event/" in request_url and "/statistics" not in request_url:
                                type_label = "DETAIL"
                                match_id = request_url.split('/')[-1]
                                if not match_id.isdigit():
                                    continue
                                target_path = os.path.join(STATS_DIR, f"{match_id}_detail.json")
                            else:
                                continue

                            current_match_id = match_id if 'match_id' in locals() else "N/A"
                            try:
                                response_body = driver.execute_cdp_cmd('Network.getResponseBody', {'requestId': request_id})
                                body = response_body.get('body', '')
                                if body:
                                    json_data = json.loads(body)
                                    if "error" not in json_data:
                                        with open(target_path, 'w', encoding='utf-8') as f:
                                            json.dump(json_data, f)
                                        
                                        # Firebase Upload
                                        try:
                                            from firebase_uploader import upload_to_firebase
                                            if type_label == "LIVE_LIST":
                                                upload_to_firebase("live_events", json_data)
                                            elif type_label == "STATS":
                                                upload_to_firebase(f"stats/{match_id}/stats", json_data)
                                            elif type_label == "DETAIL":
                                                upload_to_firebase(f"stats/{match_id}/detail", json_data)
                                        except Exception as e:
                                            logger.warning(f"Firebase upload failed: {e}")

                                        if type_label == "LIVE_LIST":
                                            logger.info(f"Captured LIVE_LIST -> {target_path}")
                                        else:
                                            logger.info(f"Captured {type_label} for {match_id} -> {target_path}")
                                    else:
                                        logger.warning(f"API Error for {current_match_id} ({type_label}), saving empty marker.")
                                        with open(target_path, 'w', encoding='utf-8') as f:
                                            json.dump({"error": "No data available", "items": []}, f)
                            except Exception as e:
                                continue

                except Exception:
                    continue
            
            if time.time() - last_live_fetch > LIVE_FETCH_INTERVAL:
                logger.info(f"Periodic manual fetch for LIVE_LIST (TS: {int(time.time())})")
                cb = int(time.time())
                driver.execute_script(f"fetch('https://www.sofascore.com/api/v1/sport/football/events/live?cache_buster={cb}');")
                # Wait a moment then check if we captured it
                time.sleep(1)
                # Process any pending network logs
                logs = driver.get_log('performance')
                captured = False
                for entry in logs:
                    try:
                        message = json.loads(entry['message'])['message']
                        if message.get('method') == 'Network.responseReceived':
                            params = message.get('params', {})
                            response = params.get('response', {})
                            request_url = response.get('url', '')
                            if "sport/football/events/live" in request_url:
                                request_id = params['requestId']
                                response_body = driver.execute_cdp_cmd('Network.getResponseBody', {'requestId': request_id})
                                body = response_body.get('body', '')
                                if body:
                                    json_data = json.loads(body)
                                    if "events" in json_data:
                                        with open(DATA_FILE, 'w', encoding='utf-8') as f:
                                            json.dump(json_data, f)
                                        
                                        # Firebase Upload
                                        try:
                                            from firebase_uploader import upload_to_firebase
                                            upload_to_firebase("live_events", json_data)
                                        except:
                                            pass

                                        logger.info(f"Captured LIVE_LIST -> {DATA_FILE}")
                                        captured = True
                                        break
                    except:
                        continue
                # If network capture failed, use direct HTTP fallback
                if not captured:
                    fetch_live_list_directly()
                last_live_fetch = time.time()

            if time.time() - last_page_refresh > 600:
                logger.info("Safety net: Refreshing page...")
                driver.refresh()
                time.sleep(10)
                last_page_refresh = time.time()

            request_queue = 'server/stats_request.json'
            if os.path.exists(request_queue):
                try:
                    with open(request_queue, 'r') as rq:
                        req_data = json.load(rq)
                    os.remove(request_queue)
                    
                    ids = req_data.get('ids', [])
                    if ids:
                        logger.info(f"Processing queue: {len(ids)} matches")
                        for match_id in ids:
                            logger.info(f"Targeted fetch for Match ID: {match_id}")
                            # Add a small delay between fetches to avoid being flagged
                            driver.execute_script(f"fetch('https://www.sofascore.com/api/v1/event/{match_id}');")
                            time.sleep(0.5)
                            driver.execute_script(f"fetch('https://www.sofascore.com/api/v1/event/{match_id}/statistics');")
                            time.sleep(1.0)
                except Exception as e:
                    logger.error(f"Queue processing error: {e}")

            time.sleep(2)
            
    except Exception as e:
        logger.error(f"FATAL ERROR in capture loop: {e}", exc_info=True)
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    if not os.path.exists('server'): os.makedirs('server')
    if not os.path.exists(STATS_DIR): os.makedirs(STATS_DIR)
    capture_sofascore()
