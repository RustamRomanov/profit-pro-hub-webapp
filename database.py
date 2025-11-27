# database.py
import sqlite3

# Название файла базы данных (используется во всех функциях)
DB_NAME = 'profit_pro_hub_mvp.db'

def init_db():
    """Создание таблиц для MVP (имитация)"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Таблица Users (удалены внутренние комментарии)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        is_customer BOOLEAN DEFAULT FALSE, -- 0: Исполнитель, 1: Заказчик
        balance_simulated REAL DEFAULT 0.0
    );
    """)
    
    # Таблица Tasks (удалены внутренние комментарии)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        task_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                       (999, "Подписка: Тестовый Канал Profit Pro", 0.15, 500))
        cursor.execute("INSERT INTO tasks (customer_id, title, price_simulated, slots_remaining) VALUES (?, ?, ?, ?)", 
                       (999, "Комментарий: Оставить отзыв о боте", 0.10, 85))
        conn.commit()
        print("Добавлены тестовые задания.")

    conn.close()

# --- Вспомогательная функция БД для выполнения запросов ---
def db_query(query, params=(), fetchone=False, fetchall=False):
    """Универсальная функция для выполнения запросов к SQLite"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    result = None
    
    try:
        cursor.execute(query, params)
        conn.commit()
        
        if fetchone:
            result = cursor.fetchone()
        elif fetchall:
            result = cursor.fetchall()
    
    except Exception as e:
        # В случае ошибки откатываем изменения и логируем ее
        print(f"Ошибка БД в db_query: {e}")
        conn.rollback()
        result = None
    
    finally:
        conn.close()
        
    return result

# Инициализация при прямом запуске файла (для проверки)
if __name__ == '__main__':
    init_db()
    setup_initial_data()
    print(f"База данных MVP '{DB_NAME}' инициализирована.")