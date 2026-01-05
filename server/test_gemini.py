import requests
import json
import os

def test_gemini_api():
    api_key = None
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('VITE_GEMINI_API_KEY='):
                    api_key = line.split('=')[1].strip()
                    break
    except Exception: pass

    if not api_key: return

    # Using a confirmed model from the list
    model = "gemini-2.0-flash" 
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{
                "text": "Say 'API is working' if you can hear me."
            }]
        }]
    }
    
    print(f"Testing Gemini API with Model: {model}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            text = data['candidates'][0]['content']['parts'][0]['text']
            print(f"Response: {text}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_gemini_api()
