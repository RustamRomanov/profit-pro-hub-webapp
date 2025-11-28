# main.py (ПОЛНЫЙ КОД)

import json
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, 
    CommandHandler, 
    ContextTypes, 
    CallbackQueryHandler, 
    MessageHandler, 
    filters
)
import random 
from database import init_db, setup_initial_data, db_query 
from config import BOT_TOKEN, MINI_APP_URL, PROJECT_NAME

EMOJI_AVATARS = ['🟥', '🟦', '🟧', '🟪', '🟩', '🟨', '🟫', '⚫', '⚪', '🟢', '🟡', '🟣'] 

init_db()
setup_initial_data()

# --- 1. Обработчик /start ---
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    username = update.effective_user.username or update.effective_user.first_name
    
    user_data = db_query("""
        SELECT 
            user_id, balance_simulated, profile_emoji, rating, 
            profile_age, profile_gender, profile_country, 
            is_agreement_accepted, tasks_completed
        FROM users 
        WHERE user_id = ?
        """, (user_id,), fetchone=True)
    
    if not user_data:
        random_emoji = random.choice(EMOJI_AVATARS)
        
        db_query("""
            INSERT INTO users 
            (user_id, profile_emoji, rating, tasks_completed, profile_age, profile_gender, profile_country) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, 
            (user_id, random_emoji, 5.0, 0, 0, '', ''))
        
    app_button = InlineKeyboardButton(
        text=f"▶️ Открыть {PROJECT_NAME}",
        web_app=WebAppInfo(url=MINI_APP_URL)
    )
    
    keyboard = InlineKeyboardMarkup([[app_button]])

    await update.message.reply_text(
        f"👋 Добро пожаловать, **{username}**!",
        reply_markup=keyboard,
        parse_mode='Markdown'
    )

# --- 2. Обработчик нажатия кнопки (Заглушка) ---
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer("Сначала откройте Mini App.")


# --- 3. Обработчик данных из Mini App ---
async def web_app_data_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    data_json = update.effective_message.web_app_data.data 
    
    try:
        data = json.loads(data_json)
    except json.JSONDecodeError:
        await update.effective_message.reply_text("Ошибка: Неверный формат данных от Mini App.")
        return
        
    action = data.get('action')

    # A. Сохранение профиля Исполнителя (Анкета)
    if action == 'save_profile':
        age = data.get('age')
        gender = data.get('gender')
        country = data.get('country')
        
        db_query("UPDATE users SET profile_age = ?, profile_gender = ?, profile_country = ? WHERE user_id = ?", 
                 (age, gender, country, user_id))
                 
        await update.effective_message.reply_text(
            f"✅ **Анкета Исполнителя сохранена!** Вы можете выполнять задания.",
            parse_mode='Markdown'
        )
        
    # B. Сохранение факта принятия соглашения Заказчика
    elif action == 'accept_agreement':
        db_query("UPDATE users SET is_agreement_accepted = TRUE WHERE user_id = ?", (user_id,))
        await update.effective_message.reply_text(
            f"✅ **Пользовательское соглашение принято!** Теперь вы можете создавать задания.",
            parse_mode='Markdown'
        )

    # C. Выполнение задания (НОВЫЙ ФУНКЦИОНАЛ)
    elif action == 'perform_task':
        task_id = data.get('taskId')
        task_price = data.get('price')
        
        # 1. Запись факта выполнения в базу данных
        try:
            db_query("INSERT INTO completed_tasks (user_id, task_id) VALUES (?, ?)", (user_id, task_id))
        except sqlite3.IntegrityError:
            # Это сработает, если пользователь попытается выполнить задание дважды
            await update.effective_message.reply_text(
                f"🛑 **Ошибка:** Вы уже выполнили задание #{task_id}.",
                parse_mode='Markdown'
            )
            return

        # 2. Имитация зачисления средств в pending_balance (пока не реализован в main.py, но Mini App его имитирует)
        # В реальной системе здесь будет логика проверки подписки и начисления средств в эскроу.

        # 3. Обновление статистики исполнителя
        db_query("UPDATE users SET tasks_completed = tasks_completed + 1 WHERE user_id = ?", (user_id,))
        
        await update.effective_message.reply_text(
            f"✅ **Задание #{task_id} взято в работу!**\n"
            f"Средства ({task_price} ⭐️) будут зачислены после проверки.",
            parse_mode='Markdown'
        )

    
    # D. Создание задания
    elif action == 'create_task':
        title = data.get('title')
        task_type = data.get('type')
        link = data.get('link') # Ссылка на канал (или инвайт)
        price = data.get('price')
        count = data.get('count')
        total = data.get('total')
        status = data.get('status')
        
        current_balance = db_query("SELECT balance_simulated FROM users WHERE user_id = ?", (user_id,), fetchone=True)
        if current_balance:
             current_balance = current_balance[0]
        else:
             current_balance = 0.0
        
        if status == 'Запущено':
            new_balance = current_balance - total
            db_query("UPDATE users SET balance_simulated = ? WHERE user_id = ?", (new_balance, user_id))
            
            # Добавление задания
            db_query("INSERT INTO tasks (customer_id, title, price_simulated, slots_remaining, target_link) VALUES (?, ?, ?, ?, ?)", 
                       (user_id, title, price, count, link))
                       
            await update.effective_message.reply_text(
                f"✅ **Задание запущено!**\n"
                f"Название: **{title}**\n"
                f"Списано: **{total:.2f} Звезд**\n"
                f"Новый баланс: **{new_balance:.2f} Звезд**.",
                parse_mode='Markdown'
            )
        # (Остальные статусы, как и раньше, просто логируют отклонение)

# --- 4. Запуск Бота ---
def main():
    # ... (код запуска без изменений)
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data_handler))

    print(f"Бот {PROJECT_NAME} запущен и ожидает команд...")
    try:
        application.run_polling()
    except telegram.error.InvalidToken as e:
        print(f"Критическая ошибка: Неверный токен бота. Пожалуйста, проверьте config.py. Детали: {e}")

if __name__ == '__main__':
    main()