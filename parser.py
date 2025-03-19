import re
from typing import Dict, Any
from llm_parser import parse_with_llm

def parse_component(input_text: str, use_llm: bool = True) -> Dict[str, Any]:
    """
    Parse natural language input for hardware components
    
    Args:
        input_text: Natural language description of a component
        use_llm: Whether to use LLM for parsing (falls back to regex if False or LLM fails)
        
    Returns:
        Dictionary with extracted information
    """
    if use_llm:
        try:
            # Try using the LLM parser first
            return parse_with_llm(input_text)
        except Exception as e:
            print(f"LLM parsing failed, falling back to regex parsing: {str(e)}")
            # Fall back to regex parsing if LLM fails
            pass
    
    # Existing regex-based parsing logic as fallback
    input_text = input_text.strip()
    
    # Default values
    parsed_data = {
        'name': '',
        'category': 'Uncategorized',
        'specifications': '',
        'source': '',
        'quantity': 1
    }
    
    # Extract quantity
    qty_patterns = [
        r'(\d+)\s*(?:pieces|pcs|pc|qty:?|quantity:?)',
        r'qty:?\s*(\d+)',
        r'quantity:?\s*(\d+)'
    ]
    
    for pattern in qty_patterns:
        qty_match = re.search(pattern, input_text, re.IGNORECASE)
        if qty_match:
            parsed_data['quantity'] = int(qty_match.group(1))
            # Remove the quantity part from further processing
            input_text = re.sub(pattern, '', input_text, flags=re.IGNORECASE)
            break
    
    # Extract source/vendor (anything with .com, .net, etc., or containing ':')
    source_match = re.search(r'([a-zA-Z0-9._-]+\.[a-z]{2,})[:/]([^,\s]+)', input_text)
    if source_match:
        parsed_data['source'] = source_match.group(0)
        # Remove the source part from further processing
        input_text = input_text.replace(source_match.group(0), '')
    
    # Extract category and component name
    # Common hardware categories to detect
    categories = {
        'resistor': ['resistor', 'ohm'],
        'capacitor': ['capacitor', 'farad', 'µF', 'nF', 'pF'],
        'inductor': ['inductor', 'coil', 'choke', 'henry', 'µH', 'mH'],
        'diode': ['diode', 'rectifier', 'LED'],
        'transistor': ['transistor', 'MOSFET', 'BJT', 'FET'],
        'IC': ['IC', 'integrated circuit', 'microcontroller', 'MCU', 'EEPROM', 'memory'],
        'connector': ['connector', 'jack', 'plug', 'socket', 'header', 'terminal'],
        'switch': ['switch', 'button', 'toggle'],
        'battery': ['battery', '18650'],
        'module': ['module', 'board', 'shield']
    }
    
    # Try to identify the category
    detected_category = None
    for category, keywords in categories.items():
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', input_text, re.IGNORECASE):
                detected_category = category
                break
        if detected_category:
            break
    
    if detected_category:
        parsed_data['category'] = detected_category.capitalize()
    
    # Extract name - this is a bit tricky and may need refinement
    # For now, let's assume the first part before a comma or specific measurement is the name
    name_match = re.match(r'^([^,]+?)(?:,|\s+\d+|\s+\d+\.\d+\s*[a-zA-Z]+)', input_text)
    if name_match:
        parsed_data['name'] = name_match.group(1).strip()
    else:
        # If no clear separator, just take the first portion
        words = input_text.split()
        if len(words) > 3:
            parsed_data['name'] = ' '.join(words[:3])
        else:
            parsed_data['name'] = input_text.strip()
    
    # The rest goes into specifications
    # Remove name and already processed parts
    specs_text = input_text.replace(parsed_data['name'], '', 1).strip()
    if specs_text.startswith(','):
        specs_text = specs_text[1:].strip()
    
    parsed_data['specifications'] = specs_text
    
    return parsed_data 