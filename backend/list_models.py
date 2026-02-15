import google.generativeai as genai
import os
from app.core.config import settings

def list_models():
    api_key = settings.GOOGLE_API_KEY
    if not api_key:
        print("No API Key found")
        return

    genai.configure(api_key=api_key)
    print("Listing available models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")

if __name__ == "__main__":
    list_models()
