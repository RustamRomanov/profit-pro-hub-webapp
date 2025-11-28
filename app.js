// app.js (ПОЛНЫЙ КОД - Редизайн v3: UX и Логика)

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); 
    
    // --- ИМИТАЦИЯ ДАННЫХ (В РЕАЛЬНОСТИ ПОЛУЧАЕМ ИХ С БЭКЕНДА) ---
    // Мы можем получить имя пользователя (username или first_name) из объекта tg.initDataUnsafe
    const username = tg.initDataUnsafe.user?.username || tg.initDataUnsafe.user?.first_name || 'Пользователь';
    
    // Имитация данных пользователя, которые должны загрузиться с бэкенда
    let currentUserData = { 
        name: username,
        age: 0, // 0 означает, что анкета не заполнена
        gender: '', 
        country: '',
        balance: 50.75,
        pending_balance: 15.00, 
        rating: 4.85, 
        tasks_completed: 154, // Количество выполненных заданий
        isFilled: false, // Флаг анкеты исполнителя
        isAgreementAccepted: false // Флаг соглашения заказчика
    }; 
    
    const BOT_USERNAME = '@ProfitProHub_bot'; // Имя вашего бота
    
    // Имитация списка запрещенных слов
    const FORBIDDEN_WORDS = ['мат', 'агрессия', 'порно', 'наркотики', 'мошенничество'];
    
    // Имитация данных
    let customerActiveTasks = [
        { id: 101, title: "Подписка на канал", spent: 15.0, total: 50.0, percent: 30, status: 'Запущено' },
    ];
    let workerAvailableTasks = [
        { id: 1, title: "Подписка: VIP-канал", price: 0.50, slots: 100, type: 'subscribe' },
        { id: 2, title: "Комментарий: Оставить отзыв", price: 0.35, slots: 85, type: 'comment' },
        { id: 3, title: "Подписка: Новый канал (Срочно!)", price: 0.15, slots: 500, type: 'subscribe' },
        { id: 4, title: "Реакция: 5 лайков", price: 0.10, slots: 1000, type: 'reaction' },
    ]; 
    workerAvailableTasks.sort((a, b) => b.price - a.price);

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
        // Здесь должен быть AJAX-запрос к боту для получения ВСЕХ данных из БД
        // Имитируем проверку:
        currentUserData.isFilled = !!(currentUserData.age > 0 && currentUserData.gender && currentUserData.country);
        currentUserData.isAgreementAccepted = true; // Имитируем, что соглашение принято для тестов
    }
    
    function renderGlobalHeader() {
        const headerBar = document.getElementById('global-header-bar');
        
        headerBar.innerHTML = `
            <div class="header-top-row">
                <div class="balance-info">
                    Баланс: <strong onclick="handleBalanceClick('all')" style="cursor: pointer;">${currentUserData.balance.toFixed(2)} Звезд</strong> 
                    <small>(Эскроу: ${currentUserData.pending_balance.toFixed(2)})</small>
                </div>
                <div style="color: var(--link-color); cursor: pointer;" onclick="handleBalanceClick('all')">
                    <i class="icon-tasks"></i>
                </div>
            </div>
            <div class="user-rating-row">
                <span>Привет, ${currentUserData.name}</span>
                <span class="rating-link" id="rating-link-header">
                    Рейтинг: ⭐️ ${currentUserData.rating.toFixed(2)}
                </span>
            </div>
        `;
        document.getElementById('rating-link-header').onclick = () => showModal('rating-rules-modal');
    }
    
    // --- 0.1 Управление контейнерами ---
    function showContainer(containerName) {
        loadUserData(); 
        Object.values(containers).forEach(container => container.style.display = 'none');
        
        if (containers[containerName]) {
            containers[containerName].style.display = 'block';
        }
        
        renderGlobalHeader(); 
        tabRatingElement.textContent = currentUserData.rating.toFixed(1);
        
        tabItems.forEach(item => {
            if (item.getAttribute('data-target') === containerName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        tg.MainButton.hide(); 
        
        if (containerName === 'workerTasks') renderWorkerTasks();
        if (containerName === 'customerMenu') renderCustomerMenu();
        if (containerName === 'profile') renderProfile();
        if (containerName === 'createTask') renderCreateTask();
        
        // Анкета должна исчезнуть (или не рендериться)
        document.getElementById('profile-form-header').style.display = 'none';
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
                    <div class="task-price">
                        <span class="tg-star">⭐️</span> ${task.price.toFixed(2)}
                    </div>
                </div>
            `;
        });
        
        containers.workerTasks.innerHTML = tasksHtml;
        
        document.querySelectorAll('.task-item').forEach(item => {
            item.onclick = (e) => {
                const taskId = item.dataset.taskId;
                if (!currentUserData.isFilled) {
                    showModal('profile-form-modal'); // Показываем анкету
                } else {
                    tg.showAlert(`Имитация: Вы взяли задание ${taskId} в работу.`);
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
        
        document.getElementById('btn-create-task').onclick = () => {
             if (currentUserData.isAgreementAccepted) {
                 showContainer('createTask');
             } else {
                 showModal('agreement-modal');
             }
        };
    }
    
    // --- 3. Рендер Формы Создания Задания ---
    function renderCreateTask() {
         tg.MainButton.hide();
         
         const ageOptionsMin = generateOptions(0, 99, 16);
         const ageOptionsMax = generateOptions(0, 99, 99);
         const countryOptions = generateCountryOptions(COUNTRIES);
         
         containers.createTask.innerHTML = `
            <h2>Создать Задание</h2>
            <div class="card">
                <label for="task-title">Название задания:</label>
                <input type="text" id="task-title" placeholder="Привлекательное название" required>
                
                <label for="task-type">Тип задания:</label>
                <select id="task-type">
                    <option value="subscribe" selected>Подписаться на канал</option>
                    <option value="comment">Оставить комментарий</option>
                    <option value="reaction">Поставить реакцию</option>
                </select>
                
                <div class="form-section-title">Параметры задания</div>
                
                <label for="task-link">Ссылка на канал/группу:</label>
                <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
                    <input type="text" id="task-link" placeholder="https://t.me/your_link" style="margin-bottom: 0;" required>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 5px; align-items: center; font-size: 14px;">
                    <input type="checkbox" id="is-admin-check" style="width: auto; margin: 0; transform: scale(1.2);">
                    <label for="is-admin-check" style="margin: 0; font-weight: 400; display: inline;">
                        Бот (${BOT_USERNAME}) назначен администратором?
                    </label>
                    <span style="color: var(--link-color); cursor: pointer;" onclick="showRatingRules(true)">[правила]</span>
                </div>

                <div class="form-section-title">Целевая аудитория</div>
                
                <label style="margin-bottom: 10px;">Желаемый возраст:</label>
                <div class="scroll-input-group">
                    <div>
                        <select id="age-min">${ageOptionsMin}</select>
                        <small style="color: var(--hint-color);">От</small>
                    </div>
                    <div>
                        <select id="age-max">${ageOptionsMax}</select>
                        <small style="color: var(--hint-color);">До</small>
                    </div>
                </div>
                
                <label>Пол:</label>
                <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                    <label><input type="checkbox" name="gender-M" value="M" checked> Мужской</label>
                    <label><input type="checkbox" name="gender-F" value="F" checked> Женский</label>
                    <label><input type="checkbox" name="gender-Any" value="Any" checked> Оба</label>
                </div>
                
                <label for="country-select">Страна:</label>
                <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
                    <select id="country-select" style="flex-grow: 1;">
                        <option value="ALL" selected>Все страны</option>
                        ${countryOptions}
                    </select>
                </div>
                
                <div class="form-section-title">Бюджет и Стоимость</div>
                
                <div class="scroll-input-group">
                    <div>
                        <label>Цена за выполнение (⭐️):</label>
                        <input type="number" id="task-price" placeholder="0.25" min="0.05" step="0.01" required>
                    </div>
                    <div>
                        <label>Количество выполнений:</label>
                        <input type="number" id="task-count" placeholder="100" min="10" required>
                    </div>
                </div>
                <div style="color: var(--hint-color); font-size: 13px; margin-bottom: 10px;">
                    Средняя цена на рынке (РФ): <span id="market-price">0.18</span> ⭐️
                </div>
                <div style="text-align: right; margin-top: 5px; font-size: 16px;">
                    Общая стоимость: <strong id="total-cost">0.00 ⭐️</strong>
                </div>
            </div>
        `;
        
        const priceInput = document.getElementById('task-price');
        const countInput = document.getElementById('task-count');
        const totalCostElement = document.getElementById('total-cost');
        
        function calculateTotal() {
            const price = parseFloat(priceInput.value) || 0;
            const count = parseInt(countInput.value) || 0;
            const total = price * count;
            totalCostElement.innerHTML = `${total.toFixed(2)} ⭐️`;
        }
        
        priceInput.oninput = calculateTotal;
        countInput.oninput = calculateTotal;
        
        calculateTotal();

        tg.MainButton.setText("Разместить Задание и Оплатить");
        tg.MainButton.show();
        tg.MainButton.onClick(sendTaskData);
        
        // Модальное окно правил для бота-администратора
        window.showRatingRules = function(isAdmin = false) {
            const modalContent = document.querySelector('#rating-rules-modal .modal-content');
            if (isAdmin) {
                modalContent.querySelector('h3').textContent = '🤖 Правила: Бот-Администратор';
                modalContent.querySelector('div').innerHTML = `
                    <p>Для запуска задания (подписка/комментарий), бот **@ProfitProHub_bot** должен быть добавлен администратором в рекламируемый канал/группу.</p>
                    <p>Необходимые права: **Добавление новых администраторов** (для проверки), **Просмотр информации о канале**.</p>
                    <p>Это позволяет нам автоматически проверять, выполнил ли исполнитель подписку, и гарантировать качество трафика.</p>
                `;
            }
            showModal('rating-rules-modal');
        }
        document.getElementById('modal-close-rating').onclick = () => hideModal('rating-rules-modal');
    }
    
    // --- 4. Рендер Меню ПРОФИЛЬ ---
    function renderProfile() {
        const profile = currentUserData; 

        containers.profile.innerHTML = `
            <h2>Ваш Исполнительский Профиль</h2>
            <div class="card">
                <p>Рейтинг: <span class="rating-link" id="rating-link-profile">⭐️ ${profile.rating.toFixed(2)}</span></p>
                <p>Выполнено заданий: <strong>${profile.tasks_completed}</strong></p>
            </div>
            
            <h3>История Заработка</h3>
            <div class="card" style="text-align: center;"><p>Ваша история заработка будет здесь.</p></div>
        `;
        
        tg.MainButton.hide(); 
        document.getElementById('rating-link-profile').onclick = () => showModal('rating-rules-modal');
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
    
    function showModal(id) {
        document.getElementById(id).style.display = 'flex';
        if (id === 'profile-form-modal') {
             renderProfileFormModal();
        }
    }

    function hideModal(id) {
        document.getElementById(id).style.display = 'none';
    }
    
    // Рендеринг формы профиля в модальном окне (для первого заполнения)
    function renderProfileFormModal() {
        const ageOptions = generateOptions(16, 99, 25);
        const countryOptions = generateCountryOptions(COUNTRIES);
        
        document.getElementById('profile-form-modal-content').innerHTML = `
            <h3>📝 Анкета Исполнителя</h3>
            <p>Это нужно для подбора релевантных заданий. Данные сохраняются **единожды**.</p>
            
            <label for="modal-age">Возраст:</label>
            <select id="modal-age" required>${ageOptions}</select>
            
            <label for="modal-gender">Пол:</label>
            <select id="modal-gender" required>
                <option value="M">Мужской</option>
                <option value="F">Женский</option>
            </select>
            
            <label for="modal-country">Страна:</label>
            <select id="modal-country" required>
                ${countryOptions}
            </select>
            
            <button id="modal-save-profile" class="btn-primary" style="margin-top: 15px;">Сохранить и Начать Зарабатывать</button>
        `;
        
        document.getElementById('modal-save-profile').onclick = saveProfileFromModal;
    }
    
    // Сохранение профиля из модального окна
    function saveProfileFromModal() {
        const age = document.getElementById('modal-age').value;
        const gender = document.getElementById('modal-gender').value;
        const country = document.getElementById('modal-country').value;
        
        if (!age || !gender || !country) {
            tg.showAlert("Пожалуйста, заполните все поля.");
            return;
        }
        
        currentUserData.age = parseInt(age);
        currentUserData.gender = gender;
        currentUserData.country = country;
        currentUserData.isFilled = true;
        
        // Отправка данных боту
        tg.sendData(JSON.stringify({
            action: 'save_profile',
            age: age,
            gender: gender, 
            country: country
        }));
        
        hideModal('profile-form-modal');
        tg.showAlert(`Профиль сохранен. Вы можете выполнять задания!`);
        showContainer('workerTasks');
    }
    
    // Обработка модального окна Пользовательского Соглашения
    document.getElementById('modal-accept-agreement').onclick = () => {
        currentUserData.isAgreementAccepted = true;
        
        // Отправка данных боту для сохранения
        tg.sendData(JSON.stringify({
            action: 'accept_agreement'
        }));
        
        hideModal('agreement-modal');
        showContainer('createTask'); 
    };
    document.getElementById('modal-cancel-agreement').onclick = () => {
        hideModal('agreement-modal');
        showContainer('customerMenu');
    };
    
    document.getElementById('modal-close-rating').onclick = () => hideModal('rating-rules-modal');

    // --- ЛОГИКА СОЗДАНИЯ ЗАДАНИЯ ---
    function sendTaskData() {
        const type = document.getElementById('task-type').value;
        const title = document.getElementById('task-title').value;
        const link = document.getElementById('task-link').value;
        const price = parseFloat(document.getElementById('task-price').value);
        const count = parseInt(document.getElementById('task-count').value);
        const totalCost = price * count;
        const isAdminChecked = document.getElementById('is-admin-check').checked;
        
        if (!type || !title || !link || !price || !count || totalCost <= 0 || price < 0.05 || count < 10) {
            tg.showAlert("Пожалуйста, заполните все поля корректно (Мин. цена 0.05, Мин. кол-во 10).");
            return;
        }
        
        if (totalCost > currentUserData.balance) {
            tg.showAlert(`🛑 Недостаточно средств. Требуется ${totalCost.toFixed(2)} ⭐️.`);
            return;
        }

        // 1. АВТОМАТИЧЕСКАЯ МОДЕРАЦИЯ (Симуляция)
        const isForbidden = FORBIDDEN_WORDS.some(word => title.toLowerCase().includes(word));
        if (isForbidden) {
             tg.showAlert("🛑 Задание содержит запрещенные слова. Размещение отклонено.");
             
             // Отправка данных боту (для лога)
             tg.sendData(JSON.stringify({ action: 'create_task', status: 'Отклонено модерацией' }));
             showContainer('customerMenu');
             return;
        }
        
        // 2. СИМУЛЯЦИЯ ПРОВЕРКИ АДМИНА
        let taskStatus = 'На модерации';
        let statusMessage = 'Задание отправлено на модерацию. Ожидание проверки администратора.';

        if (!isAdminChecked) {
             taskStatus = 'Не установлен администратор';
             statusMessage = '⚠️ Бот не установлен администратором в канале. Задание не запущено. Средства не списаны.';
        } else {
             taskStatus = 'Запущено';
             statusMessage = '✅ Задание запущено. Средства списаны.';
        }
        
        // 3. ВИРТУАЛЬНОЕ СПИСАНИЕ БАЛАНСА И ДОБАВЛЕНИЕ В ИСТОРИЮ
        
        let newBalance = currentUserData.balance;
        let newPending = currentUserData.pending_balance;
        
        if (taskStatus === 'Запущено') {
            newBalance -= totalCost; 
            newPending += totalCost; 
            
            customerActiveTasks.unshift({ 
                id: Date.now(), 
                title: title, 
                spent: 0.0, 
                total: totalCost, 
                percent: 0, 
                status: taskStatus 
            });
            workerAvailableTasks.unshift({ 
                id: Date.now(), 
                title: title, 
                price: price, 
                slots: count, 
                type: type 
            });
        }

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