from flask import Flask, request, jsonify, render_template, g
import os
from database import init_db, add_component, get_all_components_with_similarity_info, find_similar_components, merge_components, get_component_by_id, update_component_storage, update_component_quantity, search_components, update_component, delete_component, mark_components_not_similar
from parser import parse_component
import sqlite3
import base64
from llm_parser import process_image_with_llm

app = Flask(__name__)

# Configuration
app.config['USE_LLM_PARSER'] = True  # Set to False to use only regex parsing

# Initialize the database before the first request
# We'll use this function with app.before_request instead
def initialize_database():
    # Use a flag in g to ensure we only initialize once
    if not hasattr(g, 'db_initialized'):
        init_db()
        g.db_initialized = True

# Register the function to run before each request
@app.before_request
def before_request():
    initialize_database()

# Alternatively, initialize immediately (outside of request context)
# This works if init_db() doesn't need request context
init_db()  # Initialize the database at startup

# Replace before_first_request with a function that runs during app startup
def create_excluded_similarities_table():
    conn = sqlite3.connect('inventory.db')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS excluded_similarities (
        component1_id INTEGER NOT NULL,
        component2_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (component1_id, component2_id),
        FOREIGN KEY (component1_id) REFERENCES components (id),
        FOREIGN KEY (component2_id) REFERENCES components (id)
    )
    ''')
    conn.commit()
    conn.close()

# Execute the function immediately
create_excluded_similarities_table()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/components', methods=['GET'])
def get_components():
    try:
        components = get_all_components_with_similarity_info()
        print(f"Successfully retrieved {len(components)} components")
        return jsonify(components)
    except Exception as e:
        print(f"Error retrieving components: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/components', methods=['POST'])
def add_new_component():
    input_text = request.json.get('input', '')
    if not input_text:
        return jsonify({'error': 'No input provided'}), 400
    
    # Use LLM parsing if enabled in config
    parsed_data = parse_component(input_text, use_llm=app.config['USE_LLM_PARSER'])
    add_component(parsed_data)
    
    return jsonify({
        'message': 'Component added successfully',
        'parsed_data': parsed_data
    })

@app.route('/api/parse', methods=['POST'])
def parse_input():
    input_text = request.json.get('input', '')
    if not input_text:
        return jsonify({'error': 'No input provided'}), 400
    
    # Use LLM parsing if enabled in config
    parsed_data = parse_component(input_text, use_llm=app.config['USE_LLM_PARSER'])
    return jsonify(parsed_data)

@app.route('/api/toggle-llm', methods=['POST'])
def toggle_llm():
    # Toggle the LLM parsing setting
    app.config['USE_LLM_PARSER'] = not app.config['USE_LLM_PARSER']
    return jsonify({
        'llm_enabled': app.config['USE_LLM_PARSER']
    })

@app.route('/api/components/<int:component_id>/similar', methods=['GET'])
def get_similar_components(component_id):
    """Get components similar to the specified one"""
    similar_components = find_similar_components(component_id)
    return jsonify(similar_components)

@app.route('/api/components/merge', methods=['POST'])
def merge_component():
    """Merge two components"""
    source_id = request.json.get('source_id')
    target_id = request.json.get('target_id')
    
    if not source_id or not target_id:
        return jsonify({'error': 'Both source_id and target_id are required'}), 400
        
    success = merge_components(source_id, target_id)
    
    if not success:
        return jsonify({'error': 'Failed to merge components'}), 404
        
    # Get the updated target component
    updated_component = get_component_by_id(target_id)
    
    return jsonify({
        'message': 'Components merged successfully',
        'component': updated_component
    })

@app.route('/api/components/<int:component_id>/storage', methods=['POST'])
def update_storage(component_id):
    """Update the storage location for a component"""
    storage = request.json.get('storage', '')
    
    if update_component_storage(component_id, storage):
        updated_component = get_component_by_id(component_id)
        return jsonify({
            'message': 'Storage location updated successfully',
            'component': updated_component
        })
    else:
        return jsonify({'error': 'Failed to update storage location'}), 400

@app.route('/api/components/<int:component_id>/quantity', methods=['POST'])
def update_quantity(component_id):
    """Update the quantity for a component"""
    new_quantity = request.json.get('quantity')
    
    if new_quantity is None:
        return jsonify({'error': 'Quantity is required'}), 400
    
    try:
        new_quantity = int(new_quantity)
    except ValueError:
        return jsonify({'error': 'Quantity must be a number'}), 400
    
    if update_component_quantity(component_id, new_quantity):
        updated_component = get_component_by_id(component_id)
        return jsonify({
            'message': 'Quantity updated successfully',
            'component': updated_component
        })
    else:
        return jsonify({'error': 'Failed to update quantity'}), 400

@app.route('/api/components/search', methods=['POST'])
def search_components_api():
    """Search for components using query text and filters"""
    data = request.json or {}
    
    query = data.get('query', '')
    filters = data.get('filters', {})
    
    # Convert string numbers to integers where needed
    if 'min_quantity' in filters and filters['min_quantity'] not in [None, '']:
        try:
            filters['min_quantity'] = int(filters['min_quantity'])
        except ValueError:
            filters['min_quantity'] = None
            
    if 'max_quantity' in filters and filters['max_quantity'] not in [None, '']:
        try:
            filters['max_quantity'] = int(filters['max_quantity'])
        except ValueError:
            filters['max_quantity'] = None
    
    results = search_components(query, filters)
    return jsonify(results)

@app.route('/api/components/<int:component_id>', methods=['PUT'])
def update_component_api(component_id):
    """Update a component's details"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if update_component(component_id, data):
        updated_component = get_component_by_id(component_id)
        return jsonify({
            'message': 'Component updated successfully',
            'component': updated_component
        })
    else:
        return jsonify({'error': 'Failed to update component'}), 400

@app.route('/api/components/<int:component_id>', methods=['DELETE'])
def delete_component_api(component_id):
    """Delete a component"""
    if delete_component(component_id):
        return jsonify({
            'message': 'Component deleted successfully'
        })
    else:
        return jsonify({'error': 'Failed to delete component'}), 400

@app.route('/api/components/<int:component_id>/not-similar/<int:similar_id>', methods=['POST'])
def mark_not_similar(component_id, similar_id):
    """Mark two components as not similar"""
    if mark_components_not_similar(component_id, similar_id):
        return jsonify({
            'message': 'Components marked as not similar successfully',
            'component_id': component_id,
            'similar_id': similar_id
        })
    else:
        return jsonify({'error': 'Failed to mark components as not similar'}), 400

@app.route('/api/upload_image', methods=['POST'])
def upload_image_api():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400

    if file:
        try:
            # Read image bytes
            image_bytes = file.read()
            # Encode image to base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')

            # Process image using LLM (implement this function in llm_parser.py)
            extracted_components = process_image_with_llm(base64_image)

            added_count = 0
            errors = []

            if not extracted_components:
                 return jsonify({'error': 'Could not extract any components from the image.'}), 400

            # Add extracted components to the database
            for component_data in extracted_components:
                try:
                    # Ensure basic structure; LLM might miss fields
                    component_data.setdefault('name', 'Unknown Component')
                    component_data.setdefault('category', 'Uncategorized')
                    component_data.setdefault('specifications', '')
                    component_data.setdefault('source', '')
                    component_data.setdefault('quantity', 1)
                    add_component(component_data)
                    added_count += 1
                except Exception as e:
                    errors.append(f"Error adding '{component_data.get('name', 'Unknown')}': {str(e)}")

            return jsonify({
                'message': f'Processed image. Added {added_count} component(s).',
                'added_count': added_count,
                'errors': errors
            })

        except Exception as e:
            print(f"Error processing image: {str(e)}")
            return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

    return jsonify({'error': 'Invalid file'}), 400

if __name__ == '__main__':
    app.run(debug=True) 