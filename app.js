// app.js (ПОЛНЫЙ КОД - Редизайн v4: Функционал Заданий и UX/UI)

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); 
    
    const username = tg.initDataUnsafe.user?.username || tg.initDataUnsafe.user?.first_name || 'Пользователь';
    const userId = tg.initDataUnsafe.user?.id || 12345;
    
    // Имитация данных пользователя, которые должны загрузиться с бэкенда
    let currentUserData = { 
        name: username,
        id: userId,
        age: 0, 
        gender: '', 
        country: '',
        balance: 50.75,
        pending_balance: 15.00, 
        rating: 4.85, 
        tasks_completed: 154, 
        isFilled: false, 
        isAgreementAccepted: false 
    }; 
    
    const BOT_USERNAME = '@ProfitProHub_bot'; 
    const FORBIDDEN_WORDS = ['мат', 'агрессия', 'порно', 'наркотики', 'мошенничество'];
    
    // Имитация данных (Теперь данные о выполненных заданиях будут браться из БД)
    let customerActiveTasks = [
        { id: 101, title: "Подписка на канал", spent: 15.0, total: 50.0, percent: 30, status: 'Запущено' },
    ];
    let workerAvailableTasks = [
        { id: 1, title: "Подписка: VIP-канал", price: 0.50, slots: 100, type: 'subscribe', link: "https://t.me/example_channel_vip" },
        { id: 2, title: "Комментарий: Оставить отзыв", price: 0.35, slots: 85, type: 'comment', link: "https://t.me/example_chat_review" },
        { id: 3, title: "Подписка: Новый канал (Срочно!)", price: 0.15, slots: 500, type: 'subscribe', link: "https://t.me/example_channel_new" },
        { id: 4, title: "Реакция: 5 лайков", price: 0.10, slots: 1000, type: 'reaction', link: "https://t.me/example_post_5_likes" },
    ]; 
    workerAvailableTasks.sort((a, b) => b.price - a.price);
    
    // Имитация: Задания, которые пользователь уже выполнил (в реале берется из completed_tasks)
    let performedTaskIds = [1]; 

    const containers = {
        workerTasks: document.getElementById('worker-tasks-container'),
        customerMenu: document.getElementById('customer-menu-container'),
        createTask: document.getElementById('create-task-container'),
        profile: document.getElementById('profile-container'),
    };
    
    const tabItems = document.querySelectorAll('.tab-item');
    // const tabRatingElement = document.querySelector('.tab-rating'); // Убран по ТЗ
    
    const COUNTRIES = [
        "Россия", "Украина", "Казахстан", "Беларусь", "Узбекистан", "Армения", 
        "Грузия", "Азербайджан", "Молдова", "Кыргызстан", "Таджикистан", 
        "Туркменистан", "Латвия", "Литва", "Эстония"
    ].sort();

    // --- 0. ГЛОБАЛЬНЫЕ РЕНДЕР-ФУНКЦИИ ---
    
    function loadUserData() {
        // Имитируем, что соглашение принято для тестов
        currentUserData.isFilled = !!(currentUserData.age > 0 && currentUserData.gender && currentUserData.country);
        currentUserData.isAgreementAccepted = true; 
        
        // Фильтруем задания, чтобы не показывать выполненные
        workerAvailableTasks = workerAvailableTasks.filter(task => !performedTaskIds.includes(task.id));
    }
    
    function renderGlobalHeader() {
        const headerBar = document.getElementById('global-header-bar');
        
        // Оставили только Баланс и Эскроу
        headerBar.innerHTML = `
            <div class="header-top-row">
                <div class="balance-info">
                    Баланс: <strong onclick="handleBalanceClick('all')" style="cursor: pointer;">${currentUserData.balance.toFixed(2)} ⭐️</strong> 
                    <small>(Эскроу: ${currentUserData.pending_balance.toFixed(2)} ⭐️)</small>
                </div>
                <div style="color: var(--link-color); cursor: pointer;" onclick="handleBalanceClick('all')">
                    <i class="icon-tasks"></i>
                </div>
            </div>
        `;
    }
    
    // --- 0.1 Управление контейнерами ---
    function showContainer(containerName) {
        loadUserData(); 
        Object.values(containers).forEach(container => container.style.display = 'none');
        
        if (containers[containerName]) {
            containers[containerName].style.display = 'block';
        }
        
        renderGlobalHeader(); 
        // tabRatingElement.textContent = ''; // Убрали рейтинг из Tab Bar
        
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
        
        if (workerAvailableTasks.length === 0) {
            tasksHtml += '<div class="card"><p>Новых заданий пока нет. Загляните позже!</p></div>';
        } else {
            workerAvailableTasks.forEach(task => {
                tasksHtml += `
                    <div class="task-item" data-task-id="${task.id}" data-task-price="${task.price}" data-task-link="${task.link}">
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
        }
        
        containers.workerTasks.innerHTML = tasksHtml;
        
        document.querySelectorAll('.task-item').forEach(item => {
            item.onclick = handleTaskClick;
        });
    }
    
    // --- ЛОГИКА ВЫПОЛНЕНИЯ ЗАДАНИЯ ---
    function handleTaskClick(e) {
        const item = e.currentTarget;
        const taskId = parseInt(item.dataset.taskId);
        const taskPrice = parseFloat(item.dataset.taskPrice);
        const taskLink = item.dataset.taskLink;
        
        if (!currentUserData.isFilled) {
            showModal('profile-form-modal'); // Показываем анкету
            return;
        }

        // 1. Имитация перехода на канал/пост
        tg.openTelegramLink(taskLink); 
        
        // 2. Добавление в список выполненных (чтобы больше не выводилось)
        performedTaskIds.push(taskId);
        
        // 3. Отправка данных боту для регистрации выполнения
        tg.sendData(JSON.stringify({
            action: 'perform_task',
            taskId: taskId,
            price: taskPrice
        }));
        
        tg.showAlert(`✅ Вы перенаправлены на задание. После выполнения, средства будут начислены в Эскроу.`);
        
        // Обновляем список заданий после выполнения
        showContainer('workerTasks');
    }
    
    // --- 2. Рендер Меню Заказчика: СОЗДАТЬ ---
    function renderCustomerMenu() {
        // ... (Остается без изменений) ...
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
                        <p>Потрачено: ${task.spent.toFixed(2)} / Бюджет: ${task.total.toFixed(2)} ⭐️</p>
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
    
    // --- 3. Рендер Формы Создания Задания (ОБНОВЛЕННЫЙ UX) ---
    function renderCreateTask() {
         tg.MainButton.hide();
         
         const ageOptionsMin = generateOptions(0, 99, 16);
         const ageOptionsMax = generateOptions(0, 99, 99);
         const countryOptions = generateCountryOptions(COUNTRIES);
         
         containers.createTask.innerHTML = `
            <h2>Создать Задание</h2>
            <div class="card">
                <div style="background-color: var(--bg-color); padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--hint-color);">
                    <div style="font-weight: 700; margin-bottom: 5px; color: var(--link-color);">Шаг 1: Назначить Бота-Админа</div>
                    <p style="font-size: 14px; margin-bottom: 5px;">Пожалуйста, сделайте бота</p>
                    <p style="font-size: 16px; font-weight: 700;">
                        <span id="bot-name-copy" class="copy-to-clipboard">${BOT_USERNAME}</span>
                        администратором в вашем канале.
                    </p>
                    <p style="font-size: 13px; color: var(--hint-color);">
                        (Кликните на имя бота, чтобы скопировать. Не закрывая приложение, смахните вниз, перейдите в канал и назначьте админа.)
                    </p>
                </div>
                <label for="task-title">Название задания:</label>
                <input type="text" id="task-title" placeholder="Привлекательное название" required>
                
                <label for="task-type">Тип задания:</label>
                <select id="task-type">
                    <option value="subscribe" selected>Подписаться на канал</option>
                    <option value="comment">Оставить комментарий</option>
                    <option value="reaction">Поставить реакцию</option>
                </select>
                
                <label for="task-link">Ссылка на канал/группу:</label>
                <div style="display: flex; gap: 10px; margin-bottom: 15px; align-items: center;">
                    <input type="text" id="task-link" placeholder="Например: @MyChannel или https://t.me/+invitelink" style="margin-bottom: 0;" required>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: center; font-size: 14px;">
                    <input type="checkbox" id="is-admin-check" style="width: auto; margin: 0; transform: scale(1.2);">
                    <label for="is-admin-check" style="margin: 0; font-weight: 400; display: inline;">
                        Я назначил(а) бота администратором
                    </label>
                    <span style="color: var(--link-color); cursor: pointer;" onclick="showRatingRules(true)">[правила]</span>
                </div>

                <div class="form-section-title">Целевая аудитория</div>
                
                <label style="margin-bottom: 10px;">Желаемый возраст:</label>
                <div class="scroll-input-group">
                    <div style="flex: 0 0 50px;"><small style="color: var(--hint-color);">От</small></div>
                    <div><select id="age-min">${ageOptionsMin}</select></div>
                    <div style="flex: 0 0 50px;"><small style="color: var(--hint-color);">До</small></div>
                    <div><select id="age-max">${ageOptionsMax}</select></div>
                </div>
                
                <label>Пол:</label>
                <div style="display: flex; gap: 20px; margin-bottom: 15px;">
                    <label><input type="checkbox" name="gender-M" value="M" checked> Мужской</label>
                    <label><input type="checkbox" name="gender-F" value="F" checked> Женский</label>
                </div>
                
                <label for="country-select">Страна:</label>
                <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
                    <select id="country-select" style="flex-grow: 1;">
                        <option value="ALL" selected>Все страны</option>
                        ${countryOptions}
                    </select>
                </div>
                
                <div class="form-section-title">Стоимость и Бюджет</div>
                
                <div class="scroll-input-group">
                    <div style="flex: 3;">
                        <label>Цена за выполнение (⭐️):</label>
                        <input type="number" id="task-price" placeholder="0.25" min="0.05" step="0.01" required>
                    </div>
                    <div style="flex: 2;">
                        <label>Количество:</label>
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
        
        // --- Логика копирования ---
        document.getElementById('bot-name-copy').onclick = () => {
            navigator.clipboard.writeText(BOT_USERNAME).then(() => {
                tg.showPopup({message: `Имя бота ${BOT_USERNAME} скопировано!`});
            });
        };
        
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
        
        // Модальное окно правил для бота-администратора (Правила Рейтинга переименованы)
        window.showRatingRules = function(isAdmin = false) {
            const modalContent = document.querySelector('#rating-rules-modal .modal-content');
            if (isAdmin) {
                modalContent.querySelector('h3').textContent = '🤖 Правила: Бот-Администратор';
                modalContent.querySelector('div').innerHTML = `
                    <p>Для запуска задания (подписка/комментарий), бот **@ProfitProHub_bot** должен быть добавлен администратором в рекламируемый канал/группу.</p>
                    <p>Необходимые права: **Добавление новых администраторов** (для проверки), **Просмотр информации о канале**.</p>
                    <p>Это позволяет нам автоматически проверять, выполнил ли исполнитель подписку, и гарантировать качество трафика.</p>
                `;
            } else {
                 modalContent.querySelector('h3').textContent = '⭐️ Правила Рейтинга Исполнителя';
                 modalContent.querySelector('div').innerHTML = `
                    <p>Ваш рейтинг (от 1.0 до 5.0) зависит от качества и скорости выполнения заданий.</p>
                    <p>– **Рост Рейтинга:** Начисляется за быстрое и безошибочное выполнение заданий.</p>
                    <p>– **Снижение Рейтинга:** Происходит за жалобы от заказчиков, отмену выполнения или несоблюдение условий.</p>
                    <p>– **Бонус:** Исполнители с рейтингом выше 4.5 получают **сниженную комиссию** на вывод средств. При 5.0 комиссия минимальна.</p>
                 `;
            }
            showModal('rating-rules-modal');
        }
        document.getElementById('modal-close-rating').onclick = () => hideModal('rating-rules-modal');
    }
    
    // --- 4. Рендер Меню ПРОФИЛЬ (ОБНОВЛЕННЫЙ UX) ---
    function renderProfile() {
        const profile = currentUserData; 

        containers.profile.innerHTML = `
            <h2>Профиль</h2>
            
            <div class="card">
                <p>Выполнено заданий: <strong>${profile.tasks_completed}</strong></p>
                <p>Ваш текущий Рейтинг: <span class="rating-link" id="rating-link-profile">⭐️ ${profile.rating.toFixed(2)}</span></p>
            </div>
            
            <h3>История Заработка</h3>
            <div class="card" style="text-align: center;"><p>Ваша история заработка будет здесь.</p></div>
        `;
        
        tg.MainButton.hide(); 
        document.getElementById('rating-link-profile').onclick = () => showRatingRules(false);
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
             
             tg.sendData(JSON.stringify({ action: 'create_task', status: 'Отклонено модерацией' }));
             showContainer('customerMenu');
             return;
        }
        
        // 2. СИМУЛЯЦИЯ ПРОВЕРКИ АДМИНА
        let taskStatus = 'На модерации';
        let statusMessage = '';

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