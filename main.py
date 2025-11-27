# main.py
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, CallbackQueryHandler
import sqlite3
# --- КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Импортируем модуль целиком ---
import database 
from config import BOT_TOKEN, MINI_APP_URL, PROJECT_NAME

# Инициализируем БД и тестовые данные при старте, используя префикс 'database.'
database.init_db()
database.setup_initial_data()

# --- Вспомогательные функции БД (используем db_query из модуля database)---
# Эта функция db_query теперь находится в database.py

# --- 1. Обработчик /start ---
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # Регистрация или проверка пользователя
    # Используем database.db_query()
    user_data = database.db_query("SELECT is_customer FROM users WHERE user_id = ?", (user_id,), fetchone=True)
    
    if not user_data:
        # Новый пользователь
        database.db_query("INSERT INTO users (user_id) VALUES (?)", (user_id,))
        is_customer = False
    else:
        is_customer = bool(user_data[0])
        
    role_text = "Заказчика (Продвижение)" if is_customer else "Исполнителя (Заработок)"
    role_button_text = "💼 Сменить на Исполнителя" if is_customer else "💸 Сменить на Заказчика"

    # ... (далее код, который не меняется, кроме обращения к database.db_query) ...
    
    # Кнопка для запуска Mini App (Главная)
    app_button = InlineKeyboardButton(
        text=f"▶️ Открыть {PROJECT_NAME}",
        web_app=WebAppInfo(url=MINI_APP_URL)
    )
    
    # Кнопка для переключения роли
    role_button = InlineKeyboardButton(
        text=role_button_text,
        callback_data='switch_role'
    )
    
    keyboard = InlineKeyboardMarkup([[app_button], [role_button]])

    await update.message.reply_text(
        f"Добро пожаловать в **{PROJECT_NAME}**! \n\n"
        f"Текущий режим: **{role_text}**.\n\n"
        f"Нажмите ниже, чтобы открыть Mini App и начать работу.",
        reply_markup=keyboard,
        parse_mode='Markdown'
    )

# --- 2. Обработчик нажатия кнопки (Переключение роли) ---
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    if query.data == 'switch_role':
        user_id = query.from_user.id
        
        # Переключаем статус в БД
        database.db_query("UPDATE users SET is_customer = NOT is_customer WHERE user_id = ?", (user_id,))
        
        # Проверяем новый статус
        is_customer = bool(database.db_query("SELECT is_customer FROM users WHERE user_id = ?", (user_id,), fetchone=True)[0])
        
        # Обновление текста кнопок
        role_text = "Заказчика (Продвижение)" if is_customer else "Исполнителя (Заработок)"
        role_button_text = "💼 Сменить на Исполнителя" if is_customer else "💸 Сменить на Заказчика"
        
        app_button = InlineKeyboardButton(
            text=f"▶️ Открыть {PROJECT_NAME}",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )
        role_button = InlineKeyboardButton(
            text=role_button_text,
            callback_data='switch_role'
        )
        keyboard = InlineKeyboardMarkup([[app_button], [role_button]])
        
        await query.edit_message_text(
            f"✅ **Ваш режим изменен на: {role_text}**.\n\n"
            f"Нажмите 'Открыть {PROJECT_NAME}' снова, чтобы увидеть новый интерфейс.",
            reply_markup=keyboard,
            parse_mode='Markdown'
        )

# --- 3. Запуск Бота ---
def main():
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("menu", start_command))
    application.add_handler(CallbackQueryHandler(button_callback))

    print(f"Бот {PROJECT_NAME} запущен и ожидает команд...")
    application.run_polling()

if __name__ == '__main__':
    main()