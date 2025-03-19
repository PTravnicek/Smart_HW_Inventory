from flask import Flask, request, jsonify, render_template, g
import os
from database import init_db, add_component, get_all_components_with_similarity_info, find_similar_components, merge_components, get_component_by_id, update_component_storage, update_component_quantity, search_components, update_component, delete_component
from parser import parse_component

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

if __name__ == '__main__':
    app.run(debug=True) 