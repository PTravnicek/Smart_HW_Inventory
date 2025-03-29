import os
import json
import requests
import base64
from typing import Dict, Any, Optional, List
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

# New function to process images
def process_image_with_llm(base64_image: str) -> List[Dict[str, Any]]:
    """
    Use a vision LLM to analyze an image and extract component details.

    Args:
        base64_image: Base64 encoded string of the image.

    Returns:
        A list of dictionaries, each representing an extracted component.
    """
    extracted_components = []
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo", # Use the latest general vision model
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze the provided image. Identify descriptions of electronic components.
This could be a photo of a single component package or a scanned list/document showing multiple components.
For each distinct component found, extract the following details:
1.  'name': The primary name or part number.
2.  'category': Infer a general category (e.g., Resistor, Capacitor, IC, Connector, Module, Transistor, Diode). Use 'Uncategorized' if unsure.
3.  'specifications': Any relevant technical details (voltage, resistance, capacitance, package type, size, tolerance, power rating, etc.). Combine them into a single string.
4.  'source': If a source or manufacturer is clearly identifiable (e.g., Mouser, Digikey, Texas Instruments), include it. Otherwise, leave as an empty string.
5.  'quantity': The number of pieces. If not specified, assume 1. Ensure this is an integer.

Ignore any text not related to electronic component descriptions.
Return the results ONLY as a valid JSON array of objects. Each object in the array should represent one component and contain the keys 'name', 'category', 'specifications', 'source', and 'quantity'.
Example object: {"name": "LM7805", "category": "Voltage Regulator", "specifications": "TO-220, 5V, 1.5A", "source": "Texas Instruments", "quantity": 5}
If no components are found, return an empty JSON array []."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}" # Assuming JPEG, adjust if needed or let model infer
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000 # Adjust as needed
        )

        result_text = response.choices[0].message.content.strip()

        # Clean up potential markdown code blocks around the JSON
        if "```json" in result_text:
            json_start = result_text.find("```json") + 7
            json_end = result_text.find("```", json_start)
            result_text = result_text[json_start:json_end].strip()
        elif result_text.startswith("```") and result_text.endswith("```"):
             result_text = result_text[3:-3].strip()

        # Parse the JSON response
        extracted_components = json.loads(result_text)

        # Basic validation and type correction
        for comp in extracted_components:
            comp['quantity'] = int(comp.get('quantity', 1)) # Ensure quantity is int
            comp['source'] = comp.get('source', '') # Ensure source is string
            comp['specifications'] = comp.get('specifications', '') # Ensure specs is string


    except json.JSONDecodeError:
        print(f"Error: LLM returned invalid JSON: {result_text}")
        raise ValueError("LLM response was not valid JSON.")
    except Exception as e:
        print(f"Error processing image with LLM: {str(e)}")
        # Reraise or return empty list depending on desired behavior
        raise e # Reraise the exception

    return extracted_components 