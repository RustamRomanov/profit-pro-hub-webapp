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
# Добавляем импорт random
import random 
from database import init_db, setup_initial_data, db_query # Предполагается, что database.py существует
from config import BOT_TOKEN, MINI_APP_URL, PROJECT_NAME

# Список эмодзи для аватаров (безликие, цветные)
EMOJI_AVATARS = ['🟥', '🟦', '🟧', '🟪', '🟩', '🟨', '🟫', '⚫', '⚪', '🟢', '🟡', '🟣'] 

# Инициализируем БД и тестовые данные при старте
init_db()
setup_initial_data()

# --- 1. Обработчик /start (Только информация и кнопка Mini App) ---
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # 1. Проверяем пользователя и присваиваем новые поля, если он новый
    # Обновляем запрос: теперь нам нужны все поля для Mini App
    user_data = db_query("SELECT user_id, balance_simulated, profile_emoji, rating FROM users WHERE user_id = ?", (user_id,), fetchone=True)
    
    if not user_data:
        # Если пользователь новый, присваиваем рандомный эмодзи и начальный рейтинг
        random_emoji = random.choice(EMOJI_AVATARS)
        initial_rating = 5.0 # Начинаем с 5.0
        
        # Предполагаем, что INSERT ожидает profile_emoji и rating
        db_query("INSERT INTO users (user_id, profile_emoji, rating) VALUES (?, ?, ?)", 
                 (user_id, random_emoji, initial_rating))
        
        balance = 0.0
    else:
        balance = user_data[1]

    # Кнопка для запуска Mini App (без параметров)
    app_button = InlineKeyboardButton(
        text=f"▶️ Открыть {PROJECT_NAME}",
        web_app=WebAppInfo(url=MINI_APP_URL)
    )
    
    keyboard = InlineKeyboardMarkup([[app_button]])

    await update.message.reply_text(
        f"👋 Добро пожаловать в **{PROJECT_NAME}**! \n\n"
        f"**Это платформа для:**\n"
        f"1. **Заработка:** Выполняйте простые задания и получайте **Звезды**.\n"
        f"2. **Продвижения:** Создавайте задания (подписки, комментарии) для своего канала.\n\n"
        f"Нажмите ниже, чтобы начать работу:",
        reply_markup=keyboard,
        parse_mode='Markdown'
    )

# --- 2. Обработчик нажатия кнопки (Заглушка) ---
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer("Сначала откройте Mini App.")


# --- 3. Обработчик данных из Mini App (Логика "Создать задание" и Профиль) ---
async def web_app_data_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    data_json = update.effective_message.web_app_data.data 
    
    try:
        data = json.loads(data_json)
    except json.JSONDecodeError:
        await update.effective_message.reply_text("Ошибка: Неверный формат данных от Mini App.")
        return
        
    action = data.get('action')

    # A. Сохранение профиля Исполнителя
    if action == 'save_profile':
        age = data.get('age')
        gender = data.get('gender')
        country = data.get('country')
        
        # Предполагается, что поля profile_age, profile_gender, profile_country существуют в таблице users
        db_query("UPDATE users SET profile_age = ?, profile_gender = ?, profile_country = ? WHERE user_id = ?", 
                 (age, gender, country, user_id))
                 
        await update.effective_message.reply_text(
            f"✅ **Профиль Исполнителя сохранен!**\n"
            f"Возраст: {age}, Пол: {gender}, Страна: {country}.",
            parse_mode='Markdown'
        )
        
    # B. Установка режима Заказчика (старый, возможно, неактуальный код)
    elif action == 'set_customer_mode':
        # Этот блок кода должен быть обновлен, если логика set_customer_mode отличается
        # от новой логики 'save_profile' и 'create_task'
        # В данный момент оставлю его как заглушку, так как Mini App его не вызывает
        await update.effective_message.reply_text(
            f"💰 **Режим Заказчика (Продвижение) установлен!**\n\n"
            f"Для пополнения или вывода средств нажмите на баланс в Mini App.",
            parse_mode='Markdown'
        )

    
    # C. Создание задания
    elif action == 'create_task':
        title = data.get('title')
        task_type = data.get('type')
        link = data.get('link')
        task_details = data.get('details') # Дополнительное описание задания
        price = data.get('price')
        count = data.get('count')
        total = data.get('total')
        
        # Получаем текущий баланс из БД
        current_balance = db_query("SELECT balance_simulated FROM users WHERE user_id = ?", (user_id,), fetchone=True)
        if current_balance:
             current_balance = current_balance[0]
        else:
             # Этого не должно случиться, так как пользователь регистрируется в start_command
             current_balance = 0.0
        
        if current_balance >= total:
            new_balance = current_balance - total
            db_query("UPDATE users SET balance_simulated = ? WHERE user_id = ?", (new_balance, user_id))
            
            # Добавление задания (имитация, модерация)
            # Предполагается, что таблица tasks существует
            db_query("INSERT INTO tasks (customer_id, title, price_simulated, slots_remaining) VALUES (?, ?, ?, ?)", 
                       (user_id, title, price, count))
                       
            await update.effective_message.reply_text(
                f"✅ **Задание отправлено на модерацию!**\n\n"
                f"Название: **{title}** (Тип: {task_type})\n"
                f"Ссылка: {link}\n"
                f"Списано: **{total:.2f} Звезд**\n"
                f"Новый баланс: **{new_balance:.2f} Звезд**.",
                parse_mode='Markdown'
            )
        else:
            await update.effective_message.reply_text(
                f"🛑 **Ошибка: Недостаточно средств!**\n"
                f"Требуется: {total:.2f} Звезд | На счете: {current_balance:.2f} Звезд.",
                parse_mode='Markdown'
            )


# --- 4. Запуск Бота ---
def main():
    # Используем Application.builder().token()
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("menu", start_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Обработчик данных из Mini App
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data_handler))

    print(f"Бот {PROJECT_NAME} запущен и ожидает команд...")
    application.run_polling()

if __name__ == '__main__':
    main()