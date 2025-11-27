// app.js (ПОЛНЫЙ КОД - Редизайн v2)

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); 
    
    // --- ГЛОБАЛЬНЫЕ ДАННЫЕ И СОСТОЯНИЕ ---
    let isProfileFilled = true; // Имитация заполненного профиля по умолчанию
    let currentUserData = { 
        age: 25, 
        gender: 'M', 
        country: 'Россия',
        balance: 50.75,
        pending_balance: 15.00, // Средства в Эскроу или заморожены
        rating: 4.85, 
        isFilled: true 
    }; 
    
    // Имитация списка запрещенных слов для модерации
    const FORBIDDEN_WORDS = ['мат', 'агрессия', 'порно', 'наркотики', 'мошенничество'];

    // Имитация активных заданий заказчика (для истории)
    let customerActiveTasks = [
        { id: 101, title: "Подписка на канал", spent: 15.0, total: 50.0, percent: 30, status: 'Запущено' },
    ];
    
    // Имитация доступных заданий для исполнителя
    let workerAvailableTasks = [
        { id: 1, title: "Подписка: VIP-канал", price: 0.50, slots: 100, type: 'subscribe' },
        { id: 2, title: "Комментарий: Оставить отзыв", price: 0.35, slots: 85, type: 'comment' },
        { id: 3, title: "Подписка: Новый канал (Срочно!)", price: 0.15, slots: 500, type: 'subscribe' },
        { id: 4, title: "Реакция: 5 лайков", price: 0.10, slots: 1000, type: 'reaction' },
        { id: 5, title: "Комментарий: Вопрос по теме", price: 0.40, slots: 50, type: 'comment' },
        { id: 6, title: "Подписка: Игровой канал", price: 0.25, slots: 300, type: 'subscribe' },
        { id: 7, title: "Репост в 5 чатов", price: 0.60, slots: 20, type: 'repost' },
        { id: 8, title: "Комментарий: Длинный текст", price: 0.80, slots: 10, type: 'comment' },
    ]; 
    workerAvailableTasks.sort((a, b) => b.price - a.price); // Сортируем по цене

    const containers = {
        workerTasks: document.getElementById('worker-tasks-container'),
        customerMenu: document.getElementById('customer-menu-container'),
        createTask: document.getElementById('create-task-container'),
        profile: document.getElementById('profile-container'),
    };
    
    const tabItems = document.querySelectorAll('.tab-item');
    const tabRatingElement = document.querySelector('.tab-rating');
    
    const COUNTRIES = [
        "Россия", "Украина", "Казахстан", "Беларусь", "Узбекистан", "Армения", 
        "Грузия", "Азербайджан", "Молдова", "Кыргызстан", "Таджикистан", 
        "Туркменистан", "Латвия", "Литва", "Эстония"
    ].sort();

    // --- 0. ГЛОБАЛЬНЫЕ РЕНДЕР-ФУНКЦИИ ---
    
    function loadUserData() {
        // В реальной версии здесь был бы AJAX-запрос к боту
        currentUserData.isFilled = !!(currentUserData.age && currentUserData.gender && currentUserData.country && currentUserData.age > 0);
        isProfileFilled = currentUserData.isFilled;
    }
    
    function renderGlobalHeader(showButtons = false) {
        const headerBar = document.getElementById('global-header-bar');
        const balance = currentUserData.balance.toFixed(2);
        const pending = currentUserData.pending_balance.toFixed(2);
        
        headerBar.innerHTML = `
            <div class="balance-info">
                Баланс: <strong>${balance} Звезд</strong> 
                <small>(В Эскроу: ${pending} Звезд)</small>
            </div>
            <div style="color: var(--link-color); cursor: pointer;" onclick="handleBalanceClick('all')">
                <i class="icon-tasks"></i>
            </div>
        `;
    }
    
    function renderProfileFormHeader() {
        const profileHeader = document.getElementById('profile-form-header');
        const profile = currentUserData; 
        
        // Показываем компактную анкету только во вкладке Профиль
        if (containers.profile.style.display !== 'block') {
            profileHeader.style.display = 'none';
            return;
        }

        profileHeader.style.display = 'flex';
        
        const ageOptions = generateOptions(16, 99, profile.age);
        const countryOptions = generateCountryOptions(COUNTRIES, profile.country);

        profileHeader.innerHTML = `
            <select id="header-age" required>
                <option value="0" disabled ${profile.age === 0 ? 'selected' : ''}>Возраст</option>
                ${ageOptions}
            </select>
            <select id="header-gender" required>
                <option value="" disabled ${!profile.gender ? 'selected' : ''}>Пол</option>
                <option value="M" ${profile.gender === 'M' ? 'selected' : ''}>Мужской</option>
                <option value="F" ${profile.gender === 'F' ? 'selected' : ''}>Женский</option>
            </select>
            <select id="header-country" required>
                <option value="" disabled ${!profile.country ? 'selected' : ''}>Страна</option>
                ${countryOptions}
            </select>
            <button id="header-save-btn" class="btn-primary" style="width: 100px; padding: 8px;">Сохранить</button>
        `;
        
        document.getElementById('header-save-btn').onclick = saveProfileFromHeader;
    }

    // --- 0.1 Управление контейнерами ---
    function showContainer(containerName) {
        loadUserData(); // Обновляем данные перед рендером
        Object.values(containers).forEach(container => container.style.display = 'none');
        if (containers[containerName]) {
            containers[containerName].style.display = 'block';
        }
        
        renderGlobalHeader(); // Всегда показываем баланс
        
        // Обновляем рейтинг в Tab Bar
        tabRatingElement.textContent = `⭐️ ${currentUserData.rating.toFixed(1)}`;
        
        tabItems.forEach(item => {
            if (item.getAttribute('data-target') === containerName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Рендер основной контент и компактной формы, если нужно
        renderProfileFormHeader();
        
        tg.MainButton.hide(); 
        
        if (containerName === 'workerTasks') renderWorkerTasks();
        if (containerName === 'customerMenu') renderCustomerMenu();
        if (containerName === 'profile') renderProfile();
        if (containerName === 'createTask') renderCreateTask();
    }
    
    tabItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            showContainer(target);
        });
    });

    // --- 1. Рендер Заданий (Исполнитель) ---
    function renderWorkerTasks() {
        let tasksHtml = '<h2>💰 Доступные Задания</h2>';
        
        workerAvailableTasks.forEach(task => {
            tasksHtml += `
                <div class="task-item" data-task-id="${task.id}">
                    <div class="task-title">
                        ${task.title}
                        <small style="color: var(--hint-color); display: block;">Осталось: ${task.slots} слотов</small>
                    </div>
                    <div class="task-price" data-price="${task.price.toFixed(2)} Звезд">
                        ${task.price.toFixed(2)} Звезд
                    </div>
                </div>
            `;
        });
        
        containers.workerTasks.innerHTML = tasksHtml;
        
        document.querySelectorAll('.task-item').forEach(item => {
            item.onclick = (e) => {
                const taskId = item.dataset.taskId;
                if (!isProfileFilled) {
                    showModal('profile-form-modal', true); 
                } else {
                    tg.showAlert(`Имитация: Вы взяли задание ${taskId} в работу. Вы заработаете ${item.querySelector('.task-price').dataset.price}.`);
                }
            };
        });
    }
    
    // --- 2. Рендер Меню Заказчика: СОЗДАТЬ ---
    function renderCustomerMenu() {
        let activeTasksHtml = '<h3>📈 Активные и Завершенные Задания</h3>';

        if (customerActiveTasks.length === 0) {
             activeTasksHtml += '<div class="card"><p>У вас нет активных заданий.</p></div>';
        } else {
            customerActiveTasks.forEach(task => {
                const percent = ((task.spent / task.total) * 100) || 0;
                activeTasksHtml += `
                    <div class="card">
                        <strong>${task.title}</strong>
                        <p style="margin-top: 5px; font-size: 14px;">Статус: <span style="font-weight: 700; color: ${task.status === 'Запущено' ? 'var(--link-color)' : 'orange'};">${task.status}</span></p>
                        <p>Потрачено: ${task.spent.toFixed(2)} / Бюджет: ${task.total.toFixed(2)} Звезд</p>
                        <div class="progress-bar">
                            <div class="progress" style="width:${Math.max(percent, 5)}%;">${percent.toFixed(0)}%</div>
                        </div>
                    </div>
                `;
            });
        }
        
        containers.customerMenu.innerHTML = `
            <h2>📣 Размещение Рекламы</h2>
            <button id="btn-create-task" class="btn-primary" style="margin-bottom: 20px;">➕ Создать Новое Задание</button>
            
            ${activeTasksHtml}
        `;
        
        document.getElementById('btn-create-task').onclick = () => showModal('agreement-modal'); // Сначала показываем соглашение
    }
    
    // --- 3. Рендер Формы Создания Задания ---
    function renderCreateTask() {
         tg.MainButton.hide();
         
         containers.createTask.innerHTML = `
            <h2>Создать Задание</h2>
            <div class="card">
                <p style="color: var(--hint-color); font-size: 14px; margin-top: -5px;">Минимальная цена: 0.05 Звезд, Мин. количество: 10.</p>
                
                <label for="task-type">Тип задания:</label>
                <select id="task-type">
                    <option value="">Выберите тип</option>
                    <option value="subscribe">Подписаться на канал</option>
                    <option value="comment">Оставить комментарий</option>
                    <option value="reaction">Поставить реакцию</option>
                </select>
                
                <label>Название задания:</label>
                <input type="text" id="task-title" placeholder="Привлекательное название" required>
                
                <label>Ссылка на объект (канал/пост):</label>
                <input type="text" id="task-link" placeholder="https://t.me/your_link" required>
                
                <div class="select-group">
                    <div>
                        <label>Цена за выполнение (Звезды):</label>
                        <input type="number" id="task-price" placeholder="0.25" min="0.05" step="0.01" required>
                    </div>
                    <div>
                        <label>Количество выполнений:</label>
                        <input type="number" id="task-count" placeholder="100" min="10" required>
                    </div>
                </div>
                <div style="text-align: right; margin-top: 5px; font-size: 16px;">
                    Общая стоимость: <strong id="total-cost">0.00 Звезд</strong>
                </div>
            </div>
        `;
        
        // Расчет общей стоимости
        const priceInput = document.getElementById('task-price');
        const countInput = document.getElementById('task-count');
        const totalCostElement = document.getElementById('total-cost');
        
        function calculateTotal() {
            const price = parseFloat(priceInput.value) || 0;
            const count = parseInt(countInput.value) || 0;
            const total = price * count;
            totalCostElement.textContent = `${total.toFixed(2)} Звезд`;
        }
        
        priceInput.oninput = calculateTotal;
        countInput.oninput = calculateTotal;

        tg.MainButton.setText("Разместить Задание и Оплатить");
        tg.MainButton.show();
        tg.MainButton.onClick(sendTaskData);
    }
    
    // --- 4. Рендер Меню ПРОФИЛЬ (Остальная информация) ---
    function renderProfile() {
        const profile = currentUserData; 

        // Заголовок и форма уже в #profile-form-header, здесь только остальная инфо.
        containers.profile.innerHTML = `
            <h3>Ваша статистика</h3>
            <div class="card">
                <p>Баланс для вывода: <strong>${profile.balance.toFixed(2)} Звезд</strong></p>
                <p>Средний Рейтинг: ⭐️ <strong>${profile.rating.toFixed(2)}</strong></p>
                <p>Статус Анкеты: ${profile.isFilled ? 
                    '✅ Заполнена' : 
                    '⚠️ Не заполнена. Заполните вверху.'}
                </p>
            </div>
            
            <h3>История Выполненных Заданий</h3>
            <div class="card" style="text-align: center;"><p>История вашего заработка.</p></div>
        `;
        
        tg.MainButton.hide(); // Сохранение уже обрабатывается отдельной кнопкой в хедере
    }
    
    // --- Вспомогательные функции ---
    
    function generateOptions(start, end, selected = null) {
        let options = '';
        for (let i = start; i <= end; i++) {
            options += `<option value="${i}" ${i == selected ? 'selected' : ''}>${i}</option>`;
        }
        return options;
    }
    
    function generateCountryOptions(countries, selected = null) {
        let options = '';
        countries.forEach(country => {
            options += `<option value="${country}" ${country === selected ? 'selected' : ''}>${country}</option>`;
        });
        return options;
    }
    
    // --- Обработчики Модальных окон и Логики ---
    
    function showModal(id, loadProfileData = false) {
        document.getElementById(id).style.display = 'flex';
        if (id === 'profile-form-modal' && loadProfileData) {
            renderProfileFormModal(currentUserData);
        }
    }

    function hideModal(id) {
        document.getElementById(id).style.display = 'none';
    }
    
    // Обработка модального окна Пользовательского Соглашения
    document.getElementById('modal-accept-agreement').onclick = () => {
        hideModal('agreement-modal');
        showContainer('createTask'); // Переходим к форме создания
    };
    document.getElementById('modal-cancel-agreement').onclick = () => {
        hideModal('agreement-modal');
        showContainer('customerMenu'); // Возвращаемся в меню заказчика
    };

    // Рендеринг формы профиля в модальном окне (для первого заполнения)
    function renderProfileFormModal(profile) {
        // ... (логика рендеринга формы как раньше, но с кнопкой "Сохранить и начать") ...
        document.getElementById('profile-form-modal-content').innerHTML = `
            <h3>📝 Анкета Исполнителя</h3>
            <p>Заполните, чтобы начать зарабатывать.</p>
            <div class="select-group">
                </div>
            <button id="modal-save-profile" class="btn-primary" style="margin-top: 15px;">Сохранить и Начать</button>
        `;
        document.getElementById('modal-save-profile').onclick = saveProfileFromModal;
    }
    
    // Сохранение профиля из компактного хедера
    function saveProfileFromHeader() {
        const age = document.getElementById('header-age').value;
        const gender = document.getElementById('header-gender').value;
        const country = document.getElementById('header-country').value;
        
        saveProfileLogic(age, gender, country);
    }
    
    // Сохранение профиля из модального окна (первое заполнение)
    function saveProfileFromModal() {
        // ... (Получение данных из полей модального окна)
        const age = 25; // Имитация получения данных
        const gender = 'M';
        const country = 'Россия';
        
        saveProfileLogic(age, gender, country);
        hideModal('profile-form-modal');
    }

    // ЛОГИКА сохранения (общая)
    function saveProfileLogic(age, gender, country) {
        if (!age || !gender || !country) {
            tg.showAlert("Пожалуйста, заполните все поля профиля.");
            return;
        }
        
        // Обновляем текущие данные
        currentUserData.age = parseInt(age);
        currentUserData.gender = gender;
        currentUserData.country = country;
        currentUserData.isFilled = true;
        isProfileFilled = true;
        
        // Отправка данных боту
        tg.sendData(JSON.stringify({
            action: 'save_profile',
            age: age,
            gender: gender, 
            country: country
        }));
        
        tg.showAlert(`Профиль сохранен.`);
        showContainer('profile'); // Перерендеринг профиля 
    }
    
    // --- ЛОГИКА СОЗДАНИЯ ЗАДАНИЯ (КЛЮЧЕВАЯ ФУНКЦИЯ) ---
    function sendTaskData() {
        const type = document.getElementById('task-type').value;
        const title = document.getElementById('task-title').value;
        const link = document.getElementById('task-link').value;
        const price = parseFloat(document.getElementById('task-price').value);
        const count = parseInt(document.getElementById('task-count').value);
        const totalCost = price * count;
        
        if (!type || !title || !link || !price || !count || totalCost <= 0) {
            tg.showAlert("Пожалуйста, заполните все поля корректно.");
            return;
        }
        
        if (totalCost > currentUserData.balance) {
            tg.showAlert(`🛑 Недостаточно средств. Требуется ${totalCost.toFixed(2)} Звезд.`);
            return;
        }

        // 1. АВТОМАТИЧЕСКАЯ МОДЕРАЦИЯ (Симуляция)
        const isForbidden = FORBIDDEN_WORDS.some(word => title.toLowerCase().includes(word));
        if (isForbidden) {
             tg.showAlert("🛑 Задание содержит запрещенные слова. Размещение отклонено.");
             return;
        }
        
        // 2. СИМУЛЯЦИЯ ПРОВЕРКИ АДМИНА
        // В реальной жизни это делает Python-бот через getChatMember
        const linkIsGroup = link.includes('t.me/');
        
        let taskStatus = 'На модерации';
        let statusMessage = 'Задание отправлено на модерацию. Ожидание проверки администратора.';

        // Если ссылка похожа на группу, симулируем проверку админа
        if (linkIsGroup) {
            // Имитация: 80% успеха
            if (Math.random() < 0.8) {
                taskStatus = 'Запущено';
                statusMessage = '✅ Задание запущено. Средства списаны.';
            } else {
                taskStatus = 'Не установлен администратор';
                statusMessage = '⚠️ Бот не установлен администратором в канале. Задание не запущено. Средства возвращены на баланс.';
            }
        } else {
            // Если это не группа/канал, просто запускаем
            taskStatus = 'Запущено';
            statusMessage = '✅ Задание запущено. Средства списаны.';
        }
        
        // 3. ВИРТУАЛЬНОЕ СПИСАНИЕ БАЛАНСА И ДОБАВЛЕНИЕ В ИСТОРИЮ
        
        let newBalance = currentUserData.balance;
        let newPending = currentUserData.pending_balance;
        
        if (taskStatus === 'Запущено') {
            newBalance -= totalCost; // Списываем с основного баланса
            newPending += totalCost; // Добавляем в эскроу (замороженные)
            
            // Добавляем в историю заказчика
            customerActiveTasks.push({ 
                id: Date.now(), 
                title: title, 
                spent: 0.0, 
                total: totalCost, 
                percent: 0, 
                status: taskStatus 
            });
            // Добавляем в список исполнителя (для симуляции)
            workerAvailableTasks.unshift({ 
                id: Date.now(), 
                title: title, 
                price: price, 
                slots: count, 
                type: type 
            });
        }
        // Если статус "Не установлен администратор", средства не списываем/возвращаем.

        // Обновляем локальные данные (имитация)
        currentUserData.balance = newBalance;
        currentUserData.pending_balance = newPending;
        
        // 4. Отправка данных боту
        tg.sendData(JSON.stringify({
            action: 'create_task',
            type: type,
            title: title,
            link: link,
            price: price,
            count: count,
            total: totalCost,
            status: taskStatus 
        }));
        
        tg.showAlert(statusMessage);
        showContainer('customerMenu');
    }

    // Обработчик нажатия на баланс (общий)
    window.handleBalanceClick = function(role) {
        tg.showAlert("Меню пополнения/вывода средств (Имитация)");
    };
    
    // Запуск приложения: начинаем с вкладки "Задания"
    loadUserData();
    showContainer('workerTasks');
});