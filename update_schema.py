import sqlite3

def add_storage_column():
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()
    
    # Check if the storage column already exists
    cursor.execute("PRAGMA table_info(components)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'storage' not in columns:
        # Add the storage column if it doesn't exist
        cursor.execute("ALTER TABLE components ADD COLUMN storage TEXT")
        print("Storage column added successfully")
    else:
        print("Storage column already exists")
    
    conn.commit()
    conn.close()

def update_schema():
    conn = sqlite3.connect('inventory.db')
    
    # Add excluded_similarities table
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
    
    print("Schema updated successfully")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_storage_column()
    update_schema() 