# database.py
import sqlite3

# Название файла базы данных
DB_NAME = 'profit_pro_hub_mvp.db'

def init_db():
    """Создание таблиц для MVP (имитация)"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Таблица Users (ДОБАВЛЕНЫ: is_agreement_accepted, tasks_completed)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            is_customer BOOLEAN DEFAULT FALSE,
            balance_simulated REAL DEFAULT 0.0,
            
            -- Поле для одноразового соглашения заказчика
            is_agreement_accepted BOOLEAN DEFAULT FALSE,
            
            -- Поля исполнителя
            profile_emoji TEXT DEFAULT '',
            rating REAL DEFAULT 5.0, 
            tasks_completed INTEGER DEFAULT 0, -- Новое поле
            
            -- Поля анкеты
            profile_age INTEGER DEFAULT 0,
            profile_gender TEXT DEFAULT '',
            profile_country TEXT DEFAULT ''
        );
    """)

    # Таблица tasks (Остается без изменений)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            title TEXT,
            price_simulated REAL,
            slots_remaining INTEGER
        );
    """)

    conn.commit()
    conn.close()

def setup_initial_data():
    """Добавление тестовых данных, если БД пуста"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Проверяем, есть ли уже тестовые задания
    cursor.execute("SELECT COUNT(*) FROM tasks")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO tasks (customer_id, title, price_simulated, slots_remaining) VALUES (?, ?, ?, ?)", 
                       (1001, "Подписка: Канал Profit Pro", 0.15, 500))
        cursor.execute("INSERT INTO tasks (customer_id, title, price_simulated, slots_remaining) VALUES (?, ?, ?, ?)", 
                       (1001, "Комментарий: Оставить отзыв", 0.10, 85))
        conn.commit()
        print("Добавлены тестовые задания.")
    
    conn.close()


def db_query(query, params=(), fetchone=False):
    """Универсальная функция для выполнения запросов к БД"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        cursor.execute(query, params)
    except sqlite3.OperationalError as e:
        print(f"SQLite Error: {e}")
        conn.close()
        raise e
    
    if query.strip().upper().startswith(("SELECT")):
        result = cursor.fetchone() if fetchone else cursor.fetchall()
    else:
        conn.commit()
        result = None
    
    conn.close()
    return result