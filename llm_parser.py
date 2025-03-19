import os
import json
import requests
from typing import Dict, Any, Optional
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_with_llm(input_text: str) -> Dict[str, Any]:
    """
    Use an LLM to parse hardware component descriptions into structured data
    
    Args:
        input_text: Natural language description of a hardware component
        
    Returns:
        Dictionary containing parsed component data
    """
    # Default fallback values
    default_result = {
        'name': '',
        'category': 'Uncategorized',
        'specifications': '',
        'source': '',
        'quantity': 1
    }
    
    try:
        # Create a prompt for the LLM
        prompt = f"""
        Parse the following hardware component description into a structured format.
        Extract the following information:
        - Component name
        - Category (resistor, capacitor, IC, connector, etc.)
        - Specifications (values, ratings, package type, etc.)
        - Source/vendor information
        - Quantity
        
        Input: "{input_text}"
        
        Return ONLY a valid JSON object with these keys: name, category, specifications, source, quantity.
        The quantity should be an integer. If any information is missing, provide reasonable defaults.
        """
        
        # Call the OpenAI API using the new interface
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Use a more capable model if needed
            messages=[
                {"role": "system", "content": "You are a hardware inventory assistant that extracts structured data from natural language descriptions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,  # Lower temperature for more consistent results
            max_tokens=500
        )
        
        # Extract the response content using the new interface
        result_text = response.choices[0].message.content.strip()
        
        # Parse the JSON response
        # Sometimes LLMs add markdown code blocks, so we need to clean that up
        if "```json" in result_text:
            # Extract JSON from code block
            json_start = result_text.find("```json") + 7
            json_end = result_text.find("```", json_start)
            result_text = result_text[json_start:json_end].strip()
        elif "```" in result_text:
            # Extract JSON from generic code block
            json_start = result_text.find("```") + 3
            json_end = result_text.find("```", json_start)
            result_text = result_text[json_start:json_end].strip()
            
        result = json.loads(result_text)
        
        # Validate and ensure all required fields are present
        required_fields = ['name', 'category', 'specifications', 'source', 'quantity']
        for field in required_fields:
            if field not in result:
                result[field] = default_result[field]
                
        # Make sure quantity is an integer
        try:
            result['quantity'] = int(result['quantity'])
        except (ValueError, TypeError):
            result['quantity'] = 1
            
        # Convert any dictionary fields to strings
        for field in ['name', 'specifications', 'source', 'category']:
            if isinstance(result[field], dict):
                # Convert dictionary to a JSON string
                result[field] = json.dumps(result[field])
            elif not isinstance(result[field], str):
                # Convert any non-string values to strings
                result[field] = str(result[field])
            
        return result
        
    except Exception as e:
        print(f"Error using LLM to parse input: {str(e)}")
        # Fallback to basic parsing if LLM fails
        from parser import parse_component
        return parse_component(input_text, use_llm=False)

# Alternative implementation using a local LLM or different API
def parse_with_alternative_llm(input_text: str) -> Optional[Dict[str, Any]]:
    """
    Use an alternative LLM implementation (local model, different API, etc.)
    """
    # Implementation details would depend on the specific LLM service or library
    # This is just a placeholder 