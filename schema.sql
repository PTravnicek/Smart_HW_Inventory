DROP TABLE IF EXISTS components;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    specifications TEXT,
    source TEXT,
    quantity INTEGER DEFAULT 1,
    storage TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS excluded_similarities (
    component1_id INTEGER NOT NULL,
    component2_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (component1_id, component2_id),
    FOREIGN KEY (component1_id) REFERENCES components (id),
    FOREIGN KEY (component2_id) REFERENCES components (id)
); 