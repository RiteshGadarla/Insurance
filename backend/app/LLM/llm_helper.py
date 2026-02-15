"""
LLM Helper Module for interacting with Google Gemini API.
This module provides functionality to generate content using Gemini models.
"""

import google.generativeai as genai
import logging
from typing import Optional
from app.core.config import settings

# Configure logger
logger = logging.getLogger(__name__)

class LLMHelper:
    """
    Helper class to interact with Google's Gemini models.
    """
    
    def __init__(self):
        """
        Initialize the LLMHelper with API key from settings.
        """
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is not set in the environment variables.")
            raise ValueError("GEMINI_API_KEY is missing")
            
        genai.configure(api_key=settings.GEMINI_API_KEY)

    def generate_response(self, prompt: str, model_name: str = "gemini-2.5-flash-lite") -> Optional[str]:
        """
        Generates a response from the Gemini model based on the provided prompt.

        Args:
            prompt (str): The input prompt for the model.
            model_name (str): The name of the Gemini model to use. Defaults to "gemini-pro".

        Returns:
            Optional[str]: The generated text response, or None if an error occurs.
        """
        if not prompt:
            logger.error("Prompt cannot be empty.")
            return None

        try:
            logger.info(f"Generating response using model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            
            if response and response.text:
                logger.info("Response generated successfully.")
                return response.text
                
            logger.warning("No text found in the response.")
            return None

        except Exception as e:
            logger.error(f"Error generating response from Gemini API: {str(e)}")
            # Depending on requirements, we might want to re-raise or return None
            # Here we return None to handle gracefully in the caller
            return None

# Create a singleton instance for easy import
llm_helper = LLMHelper()
