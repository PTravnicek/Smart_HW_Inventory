import sqlite3
import os
from datetime import datetime
import json

def get_db_connection():
    conn = sqlite3.connect('inventory.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists('inventory.db'):
        conn = get_db_connection()
        with open('schema.sql') as f:
            conn.executescript(f.read())
        conn.commit()
        conn.close()

def get_or_create_category(category_name):
    conn = get_db_connection()
    category = conn.execute('SELECT id FROM categories WHERE name = ?', 
                           (category_name,)).fetchone()
    
    if category is None:
        cursor = conn.execute('INSERT INTO categories (name) VALUES (?)', 
                             (category_name,))
        category_id = cursor.lastrowid
    else:
        category_id = category['id']
    
    conn.commit()
    conn.close()
    return category_id

def add_component(parsed_data):
    conn = get_db_connection()
    
    category_id = get_or_create_category(parsed_data['category'])
    
    # Ensure specifications is a string
    specifications = parsed_data['specifications']
    if isinstance(specifications, dict):
        specifications = json.dumps(specifications)
    
    # Get storage location if available, default to empty string
    storage = parsed_data.get('storage', '')
    
    conn.execute('''
        INSERT INTO components (category_id, name, specifications, source, quantity, storage)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        category_id,
        parsed_data['name'],
        specifications,
        parsed_data['source'],
        parsed_data['quantity'],
        storage
    ))
    
    conn.commit()
    conn.close()

def get_all_components():
    conn = get_db_connection()
    components = conn.execute('''
        SELECT c.id, c.name, c.specifications, c.source, c.quantity, c.storage, c.created_at, 
               cat.name as category
        FROM components c
        JOIN categories cat ON c.category_id = cat.id
        ORDER BY cat.name, c.name
    ''').fetchall()
    
    conn.close()
    
    result = []
    for component in components:
        result.append({
            'id': component['id'],
            'name': component['name'],
            'specifications': component['specifications'],
            'source': component['source'],
            'quantity': component['quantity'],
            'storage': component['storage'] if component['storage'] else '',
            'category': component['category'],
            'created_at': component['created_at']
        })
    
    return result

def find_similar_components(component_id):
    """Find components that are similar to the given component,
    excluding those that have been explicitly marked as not similar"""
    conn = get_db_connection()
    
    # Get the component's details
    component = conn.execute('SELECT * FROM components WHERE id = ?', (component_id,)).fetchone()
    if not component:
        conn.close()
        return []
    
    # Check if excluded_similarities table exists
    table_exists = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='excluded_similarities'"
    ).fetchone()
    
    excluded_ids = []
    
    # Get excluded similarities if the table exists
    if table_exists:
        excluded = conn.execute('''
            SELECT component2_id FROM excluded_similarities 
            WHERE component1_id = ?
        ''', (component_id,)).fetchall()
        
        excluded_ids = [row['component2_id'] for row in excluded]
    
    # Add the component itself to excluded list
    excluded_ids.append(component_id)
    
    # Build an exclusion string for the SQL query
    exclusion_placeholders = ', '.join(['?' for _ in excluded_ids])
    
    # Check for similar components, excluding the marked ones
    similar_components = conn.execute(f'''
        SELECT * FROM components 
        WHERE category_id = ? 
        AND name LIKE ? 
        AND id NOT IN ({exclusion_placeholders})
    ''', (component['category_id'], f'%{component["name"]}%', *excluded_ids)).fetchall()
    
    conn.close()
    
    return [dict(c) for c in similar_components]

def merge_components(source_id, target_id):
    """Merge source component into target component and delete the source"""
    conn = get_db_connection()
    
    # Get both components
    source = conn.execute('SELECT * FROM components WHERE id = ?', (source_id,)).fetchone()
    target = conn.execute('SELECT * FROM components WHERE id = ?', (target_id,)).fetchone()
    
    if not source or not target:
        conn.close()
        return False
    
    # Update target quantity (add source quantity)
    new_quantity = target['quantity'] + source['quantity']
    
    # Merge specifications if they're different
    target_specs = target['specifications']
    source_specs = source['specifications']
    
    if target_specs != source_specs and source_specs.strip():
        # Simple merge - could be made smarter
        if target_specs and source_specs:
            new_specs = f"{target_specs}; {source_specs}"
        else:
            new_specs = source_specs or target_specs
    else:
        new_specs = target_specs
        
    # Merge storage if different
    target_storage = target['storage'] or ''
    source_storage = source['storage'] or ''
    
    if target_storage != source_storage and source_storage.strip():
        # If target has no storage but source does, use source
        if not target_storage and source_storage:
            new_storage = source_storage
        # If both have storage, combine them
        elif target_storage and source_storage:
            new_storage = f"{target_storage}; {source_storage}"
        else:
            new_storage = target_storage
    else:
        new_storage = target_storage
    
    # Update the target component
    conn.execute('''
        UPDATE components 
        SET quantity = ?,
            specifications = ?,
            storage = ?
        WHERE id = ?
    ''', (new_quantity, new_specs, new_storage, target_id))
    
    # Delete the source component
    conn.execute('DELETE FROM components WHERE id = ?', (source_id,))
    
    conn.commit()
    conn.close()
    return True

def get_component_by_id(component_id):
    """Get a single component by ID"""
    conn = get_db_connection()
    component = conn.execute('''
        SELECT c.id, c.name, c.specifications, c.source, c.quantity, c.storage, c.created_at, 
               cat.name as category
        FROM components c
        JOIN categories cat ON c.category_id = cat.id
        WHERE c.id = ?
    ''', (component_id,)).fetchone()
    
    conn.close()
    
    if not component:
        return None
        
    return {
        'id': component['id'],
        'name': component['name'],
        'specifications': component['specifications'],
        'source': component['source'],
        'quantity': component['quantity'],
        'storage': component['storage'] if component['storage'] else '',
        'category': component['category'],
        'created_at': component['created_at']
    }

def update_component_storage(component_id, storage):
    conn = get_db_connection()
    
    conn.execute('''
        UPDATE components 
        SET storage = ?
        WHERE id = ?
    ''', (storage, component_id))
    
    conn.commit()
    conn.close()
    return True

def update_component_quantity(component_id, new_quantity):
    """Update the quantity of a component"""
    # Ensure quantity is not negative
    if new_quantity < 0:
        new_quantity = 0
        
    conn = get_db_connection()
    
    conn.execute('''
        UPDATE components 
        SET quantity = ?
        WHERE id = ?
    ''', (new_quantity, component_id))
    
    conn.commit()
    conn.close()
    return True

def search_components(query=None, filters=None):
    """
    Search components based on query string and filters
    
    Args:
        query (str): Search text to find across name, specifications, source
        filters (dict): Filter criteria for categories, quantity, storage, etc.
    """
    conn = get_db_connection()
    
    # Start building the query
    sql_query = '''
        SELECT c.id, c.name, c.specifications, c.source, c.quantity, c.storage, c.created_at, 
               cat.name as category
        FROM components c
        JOIN categories cat ON c.category_id = cat.id
        WHERE 1=1
    '''
    params = []
    
    # Add search conditions if query is provided
    if query and query.strip():
        search_term = f"%{query.strip()}%"
        sql_query += '''
            AND (
                c.name LIKE ? OR
                c.specifications LIKE ? OR
                c.source LIKE ? OR
                cat.name LIKE ? OR
                c.storage LIKE ?
            )
        '''
        params.extend([search_term, search_term, search_term, search_term, search_term])
    
    # Add filter conditions
    if filters:
        # Filter by categories (list of category names)
        if 'categories' in filters and filters['categories']:
            placeholders = ','.join(['?' for _ in filters['categories']])
            sql_query += f" AND cat.name IN ({placeholders})"
            params.extend(filters['categories'])
        
        # Filter by quantity range
        if 'min_quantity' in filters and filters['min_quantity'] is not None:
            sql_query += " AND c.quantity >= ?"
            params.append(filters['min_quantity'])
        
        if 'max_quantity' in filters and filters['max_quantity'] is not None:
            sql_query += " AND c.quantity <= ?"
            params.append(filters['max_quantity'])
        
        # Filter by storage location
        if 'storage' in filters and filters['storage']:
            sql_query += " AND c.storage LIKE ?"
            params.append(f"%{filters['storage']}%")
        
        # Filter by date range
        if 'min_date' in filters and filters['min_date']:
            sql_query += " AND c.created_at >= ?"
            params.append(filters['min_date'])
        
        if 'max_date' in filters and filters['max_date']:
            sql_query += " AND c.created_at <= ?"
            params.append(filters['max_date'])
            
        # Filter by zero quantity
        if 'show_zero_quantity' in filters:
            if filters['show_zero_quantity'] is True:
                sql_query += " AND c.quantity = 0"
            elif filters['show_zero_quantity'] is False:
                sql_query += " AND c.quantity > 0"
    
    # Add ordering
    sql_query += " ORDER BY cat.name, c.name"
    
    # Execute the query
    components = conn.execute(sql_query, params).fetchall()
    conn.close()
    
    # Format results
    result = []
    for component in components:
        result.append({
            'id': component['id'],
            'name': component['name'],
            'specifications': component['specifications'],
            'source': component['source'],
            'quantity': component['quantity'],
            'storage': component['storage'] if component['storage'] else '',
            'category': component['category'],
            'created_at': component['created_at']
        })
    
    return result

def get_all_components_with_similarity_info():
    """Get all components with information about whether they have similar items
    while respecting excluded similarity relationships"""
    conn = get_db_connection()
    
    # First, get all components
    components = conn.execute('''
        SELECT c.id, c.name, c.specifications, c.source, c.quantity, c.storage, c.created_at, 
               cat.name as category, c.category_id
        FROM components c
        JOIN categories cat ON c.category_id = cat.id
        ORDER BY cat.name, c.name
    ''').fetchall()
    
    # Check if the excluded_similarities table exists
    table_exists = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='excluded_similarities'"
    ).fetchone()
    
    # Get all excluded similarity relationships if the table exists
    excluded_pairs = set()
    if table_exists:
        excluded = conn.execute('''
            SELECT component1_id, component2_id FROM excluded_similarities
        ''').fetchall()
        
        for row in excluded:
            excluded_pairs.add((row['component1_id'], row['component2_id']))
            excluded_pairs.add((row['component2_id'], row['component1_id']))  # Add both directions
    
    # Format results and check for similarity
    result = []
    
    # Group components by category for more accurate similarity detection
    for component in components:
        has_similar = False
        component_id = component['id']
        
        # Compare with other components in the same category
        for other in components:
            if component_id == other['id']:
                continue  # Skip self comparison
                
            # Skip if this pair is in the excluded list
            if (component_id, other['id']) in excluded_pairs:
                continue
                
            # Check if names are similar and in the same category
            if (component['category_id'] == other['category_id'] and 
                component['name'].lower().strip() == other['name'].lower().strip()):
                has_similar = True
                break
        
        result.append({
            'id': component['id'],
            'name': component['name'],
            'specifications': component['specifications'],
            'source': component['source'],
            'quantity': component['quantity'],
            'storage': component['storage'] if component['storage'] else '',
            'category': component['category'],
            'created_at': component['created_at'],
            'has_similar': has_similar
        })
    
    conn.close()
    return result

def update_component(component_id, updated_data):
    """Update all details of a component"""
    conn = get_db_connection()
    
    try:
        # Get the current component data
        component = conn.execute('SELECT * FROM components WHERE id = ?', (component_id,)).fetchone()
        if not component:
            conn.close()
            return False
        
        # Get or create category if needed
        category_id = component['category_id']
        if 'category' in updated_data:
            category_id = get_or_create_category(updated_data['category'])
        
        # Handle specifications format (could be dict or string)
        specifications = updated_data.get('specifications', component['specifications'])
        if isinstance(specifications, dict):
            specifications = json.dumps(specifications)
        
        # Prepare the update query
        conn.execute('''
            UPDATE components 
            SET category_id = ?, 
                name = ?, 
                specifications = ?, 
                source = ?, 
                quantity = ?,
                storage = ?
            WHERE id = ?
        ''', (
            category_id,
            updated_data.get('name', component['name']),
            specifications,
            updated_data.get('source', component['source']),
            updated_data.get('quantity', component['quantity']),
            updated_data.get('storage', component['storage']),
            component_id
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating component: {e}")
        conn.close()
        return False 

def delete_component(component_id):
    """Delete a component from the database"""
    conn = get_db_connection()
    
    try:
        # Check if component exists
        component = conn.execute('SELECT id FROM components WHERE id = ?', (component_id,)).fetchone()
        if not component:
            conn.close()
            return False
        
        # Delete the component
        conn.execute('DELETE FROM components WHERE id = ?', (component_id,))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error deleting component: {e}")
        conn.close()
        return False 

def mark_components_not_similar(component_id, similar_id):
    """Mark two components as not similar to avoid future duplicate detection"""
    conn = get_db_connection()
    
    try:
        # Check if components exist
        component1 = conn.execute('SELECT id FROM components WHERE id = ?', (component_id,)).fetchone()
        component2 = conn.execute('SELECT id FROM components WHERE id = ?', (similar_id,)).fetchone()
        
        if not component1 or not component2:
            conn.close()
            return False
        
        # Add to excluded_similarities table (create this table if it doesn't exist)
        conn.execute('INSERT OR IGNORE INTO excluded_similarities (component1_id, component2_id) VALUES (?, ?)', 
                    (component_id, similar_id))
        
        # Also add the reverse relationship
        conn.execute('INSERT OR IGNORE INTO excluded_similarities (component1_id, component2_id) VALUES (?, ?)', 
                    (similar_id, component_id))
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error marking components as not similar: {e}")
        conn.close()
        return False 