import sqlite3

DATABASE = 'expenses.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            payment_mode TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')
    
    default_categories = [
        'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
        'Entertainment', 'Healthcare', 'Education', 'Travel',
        'Personal Care', 'Others'
    ]
    
    for category in default_categories:
        cursor.execute('INSERT OR IGNORE INTO categories (name) VALUES (?)', (category,))
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            month TEXT NOT NULL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS savings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            source TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS savings_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            goal_name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            target_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            about TEXT,
            vision_year TEXT,
            vision_month TEXT,
            company TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Migration: Add user_id column to savings table if it doesn't exist
    try:
        cursor.execute('SELECT user_id FROM savings LIMIT 1')
    except sqlite3.OperationalError:
        # Column doesn't exist, add it
        try:
            cursor.execute('ALTER TABLE savings ADD COLUMN user_id INTEGER')
            # Set user_id to 1 for existing records (if any)
            cursor.execute('UPDATE savings SET user_id = 1 WHERE user_id IS NULL')
            conn.commit()
        except sqlite3.OperationalError:
            # If column already exists or other error, just continue
            pass
    
    # Migration: Add user_id column to expenses table if it doesn't exist
    try:
        cursor.execute('SELECT user_id FROM expenses LIMIT 1')
    except sqlite3.OperationalError:
        # Column doesn't exist, add it
        try:
            cursor.execute('ALTER TABLE expenses ADD COLUMN user_id INTEGER')
            # Set user_id to 1 for existing records (if any)
            cursor.execute('UPDATE expenses SET user_id = 1 WHERE user_id IS NULL')
            conn.commit()
        except sqlite3.OperationalError:
            # If column already exists or other error, just continue
            pass
    
    # Migration: Add user_id column to savings_goals table if it doesn't exist
    try:
        cursor.execute('SELECT user_id FROM savings_goals LIMIT 1')
    except sqlite3.OperationalError:
        # Column doesn't exist, add it
        try:
            cursor.execute('ALTER TABLE savings_goals ADD COLUMN user_id INTEGER')
            # Set user_id to 1 for existing records (if any)
            cursor.execute('UPDATE savings_goals SET user_id = 1 WHERE user_id IS NULL')
            conn.commit()
        except sqlite3.OperationalError:
            # If column already exists or other error, just continue
            pass
    
    conn.commit()
    conn.close()

