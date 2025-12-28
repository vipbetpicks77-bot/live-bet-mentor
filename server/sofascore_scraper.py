import time
import json
import os
import logging
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

# Configure performance logging
caps = DesiredCapabilities.CHROME
caps['goog:loggingPrefs'] = {'performance': 'ALL'}

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
                                target_path = os.path.join(STATS_DIR, f"{match_id}_detail.json")
                            else:
                                continue

                            try:
                                response_body = driver.execute_cdp_cmd('Network.getResponseBody', {'requestId': request_id})
                                body = response_body.get('body', '')
                                if body:
                                    json_data = json.loads(body)
                                    # Don't save if it's an error response
                                    if "error" not in json_data:
                                        with open(target_path, 'w', encoding='utf-8') as f:
                                            json.dump(json_data, f)
                                        print(f"[SCRAPER] Captured {type_label} for {match_id} -> {target_path}")
                                    else:
                                        print(f"[SCRAPER] API Error for {match_id} ({type_label}), skipping save.")
                            except Exception as e:
                                # logger.debug(f"Could not get body for {request_url}: {e}")
                                continue

                except Exception:
                    continue
            
            # Polling: Explicitly trigger a live list fetch if it's been more than 60 seconds
            # This ensures we don't just wait for the browser to naturally trigger it
            if time.time() - last_live_fetch > 60:
                print("[SCRAPER] Periodic manual fetch for LIVE_LIST")
                driver.execute_script("fetch('https://www.sofascore.com/api/v1/sport/football/events/live');")
                last_live_fetch = time.time()

            # Maintenance: If there's a "stats_request.json" from the proxy, fulfill it
            request_queue = 'server/stats_request.json'
            if os.path.exists(request_queue):
                try:
                    with open(request_queue, 'r') as rq:
                        req_data = json.load(rq)
                    os.remove(request_queue)
                    
                    for match_id in req_data.get('ids', []):
                        print(f"[SCRAPER] Automated fetch for Match ID: {match_id}")
                        driver.execute_script(f"""
                            fetch('https://www.sofascore.com/api/v1/event/{match_id}');
                            fetch('https://www.sofascore.com/api/v1/event/{match_id}/statistics');
                        """)
                except Exception as e:
                    print(f"[SCRAPER] Queue processing error: {e}")

            # Polling interval
            time.sleep(10)
            
    except Exception as e:
        logger.error(f"FATAL ERROR in capture loop: {e}", exc_info=True)
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    if not os.path.exists('server'): os.makedirs('server')
    if not os.path.exists(STATS_DIR): os.makedirs(STATS_DIR)
    capture_sofascore()
