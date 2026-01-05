import requests
import json
import os

def list_gemini_models():
    api_key = None
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('VITE_GEMINI_API_KEY='):
                    api_key = line.split('=')[1].strip()
                    break
    except Exception: pass

    if not api_key: return

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            for model in data.get('models', []):
                if 'gemini' in model['name'].lower():
                    print(f"{model['name']}")
        else:
            print(f"Error: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_gemini_models()
