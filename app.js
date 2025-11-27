// app.js

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); 

    const containers = {
        modeSelection: document.getElementById('mode-selection-container'),
        workerProfile: document.getElementById('worker-profile-container'),
        workerTasks: document.getElementById('worker-tasks-container'),
        customerMenu: document.getElementById('customer-menu-container'),
        createTask: document.getElementById('create-task-container'),
    };
    
    // --- 0. Управление отображением контейнеров и Данные ---
    function showContainer(containerName) {
        Object.values(containers).forEach(container => container.style.display = 'none');
        if (containers[containerName]) {
            containers[containerName].style.display = 'block';
        }
        tg.MainButton.hide();
    }
    
    // Вспомогательная функция для имитации скролла (для возраста)
    function generateOptions(start, end, selected = null) {
        let options = '<option value="">Выберите</option>';
        for (let i = start; i <= end; i++) {
            options += `<option value="${i}" ${i == selected ? 'selected' : ''}>${i}</option>`;
        }
        return options;
    }

    // --- 1. Рендер ИНТЕРФЕЙСА ВЫБОРА (СТАРТ) ---
    function renderModeSelection() {
        showContainer('modeSelection');
        containers.modeSelection.innerHTML = `
            <h2>Выберите Режим Работы</h2>
            <div class="mode-selection">
                <button id="btn-worker">💸 Выполнить Задание (Заработок)</button>
                <button id="btn-customer">📢 Создать Задание (Продвижение)</button>
            </div>
        `;

        document.getElementById('btn-worker').onclick = renderWorkerProfile;

        document.getElementById('btn-customer').onclick = () => {
            // Заказчик: Отправка данных боту (выдача бонуса/смена роли)
            tg.sendData(JSON.stringify({ action: 'set_customer_mode' }));
            renderCustomerMenu();
        };
    }

    // --- 2. Меню Исполнителя: Заполнение Профиля ---
    function renderWorkerProfile() {
        showContainer('workerProfile');
        
        // Имитация данных (в реальной версии их нужно получать от main.py)
        const profileData = { age: 0, gender: '', country: '' }; 

        containers.workerProfile.innerHTML = `
            <h2>Профиль Исполнителя</h2>
            <div class="card">
                <p>Для доступа к заданиям, заполните ваш профиль:</p>
                
                <label for="age">Возраст (16-99):</label>
                <select id="age" required>
                    ${generateOptions(16, 99, profileData.age)}
                </select>
                
                <label for="gender">Пол:</label>
                <select id="gender" required>
                    <option value="">Выберите</option>
                    <option value="M" ${profileData.gender === 'M' ? 'selected' : ''}>Мужской</option>
                    <option value="F" ${profileData.gender === 'F' ? 'selected' : ''}>Женский</option>
                </select>
                
                <label for="country">Страна (только страны с Telegram):</label>
                <input type="text" id="country" list="country-suggestions" placeholder="Введите страну" required>
                <datalist id="country-suggestions">
                    <option value="Россия">
                    <option value="Казахстан">
                    <option value="Украина">
                    <option value="Беларусь">
                    <option value="Азербайджан">
                    <option value="Армения">
                    <option value="Грузия">
                </datalist>
            </div>
        `;
        
        tg.MainButton.setText("Сохранить и Смотреть Задания");
        tg.MainButton.show();
        tg.MainButton.onClick(saveWorkerProfile);
        
        // Добавление обработчика для имитации поиска по алфавиту
        document.getElementById('country').oninput = function() {
            // В реальном приложении здесь будет фильтрация <datalist>
            // tg.showAlert(`Имитация поиска по алфавиту для: ${this.value}`);
        };
    }

    // Обработчик сохранения профиля
    function saveWorkerProfile() {
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const country = document.getElementById('country').value;

        if (!age || !gender || !country) {
            tg.showAlert("Пожалуйста, заполните все поля профиля.");
            return;
        }
        
        // Отправка данных профиля боту для сохранения
        tg.sendData(JSON.stringify({
            action: 'save_profile',
            age: age,
            gender: gender,
            country: country
        }));
        
        // Переход к заданиям
        renderWorkerTasks();
    }


    // --- 3. Меню Исполнителя: Задания ---
    function renderWorkerTasks() {
        showContainer('workerTasks');
        
        // Имитация баланса и заданий
        const currentBalance = 5.25; 
        const tasks = [
            { id: 1, title: "Подписка: VIP-канал", price: 0.50, slots: 100 },
            { id: 2, title: "Комментарий: Оставить отзыв", price: 0.35, slots: 85 },
            { id: 3, title: "Подписка: Новый канал", price: 0.15, slots: 500 },
            // 7 других заданий можно добавить для примера
        ];
        
        // Сортировка от дорогих к дешевым
        tasks.sort((a, b) => b.price - a.price);

        let tasksHtml = '';
        tasks.forEach(task => {
            tasksHtml += `
                <div class="card">
                    <strong>${task.title}</strong>
                    <p>Цена: ${task.price.toFixed(2)} Звезд | Осталось: ${task.slots}</p>
                    <button class="btn-primary" onclick="alert('Имитация выполнения задания ${task.id}')">Выполнить</button>
                </div>
            `;
        });
        
        containers.workerTasks.innerHTML = `
            <h2>💸 Заработок | Баланс: <span class="balance-link" onclick="handleBalanceClick('worker')">${currentBalance.toFixed(2)} Звезд</span></h2>
            ${tasksHtml}
        `;
        
        tg.MainButton.setText("Вернуться к Выбору Режима");
        tg.MainButton.show();
        tg.MainButton.onClick(renderModeSelection);
    }
    
    // --- 4. Меню Заказчика ---
    function renderCustomerMenu() {
        showContainer('customerMenu');
        
        // Имитация баланса и активных заданий
        const currentBalance = 100.00;
        const activeTasks = [
            { title: "Подписка на канал", spent: 15.0, total: 50.0 },
            { title: "Лайки на пост", spent: 5.0, total: 20.0 }
        ];

        let activeTasksHtml = '<h3>📈 Ваши Активные Задания</h3>';
        if (activeTasks.length === 0) {
             activeTasksHtml += '<div class="card"><p>Активных заданий нет.</p></div>';
        } else {
            activeTasks.forEach(task => {
                const progress = (task.spent / task.total) * 100;
                activeTasksHtml += `
                    <div class="card">
                        <strong>${task.title}</strong>
                        <p>Потрачено: ${task.spent.toFixed(2)} Звезд из ${task.total.toFixed(2)} Звезд</p>
                        <div class="progress-bar">
                            <div class="progress" style="width:${Math.max(progress, 5)}%;">${progress.toFixed(0)}%</div>
                        </div>
                    </div>
                `;
            });
        }
        
        containers.customerMenu.innerHTML = `
            <h2>📢 Продвижение | Баланс: <span class="balance-link" onclick="handleBalanceClick('customer')">${currentBalance.toFixed(2)} Звезд</span></h2>
            
            <div class="customer-menu">
                <button id="btn-create-task">➕ Создать Новое Задание</button>
            </div>
            
            ${activeTasksHtml}
        `;
        
        document.getElementById('btn-create-task').onclick = renderCreateTask;
        
        tg.MainButton.setText("Вернуться к Выбору Режима");
        tg.MainButton.show();
        tg.MainButton.onClick(renderModeSelection);
    }
    
    // Обработчик нажатия на баланс (общий)
    window.handleBalanceClick = function(role) {
        tg.showAlert(`Меню ${role === 'worker' ? 'Вывода' : 'Пополнения/Вывода'} средств (Имитация).`);
    };

    // --- 5. Меню Создания Задания ---
    function renderCreateTask() {
        showContainer('createTask');
        
        containers.createTask.innerHTML = `
            <h2>Создать Задание</h2>
            <div class="card">
                <label for="task-type">Тип задания:</label>
                <select id="task-type">
                    <option value="">Выберите тип</option>
                    <option value="subscribe">Подписаться на канал</option>
                    <option value="comment">Оставить комментарий</option>
                </select>
                
                <label>Название задания:</label>
                <input type="text" id="task-title" placeholder="Привлекательное название для исполнителей">
                
                <label>Ссылка на группу/канал:</label>
                <input type="text" id="task-link" placeholder="https://t.me/your_channel">
                
                <div id="comment-details" style="display:none;">
                    <label>Детали задания (для комментариев):</label>
                    <select id="task-details">
                        <option value="default">Оставьте комментарий - отзыв о моем новом луке осень-зима.</option>
                        <option value="custom">Написать свой вариант задания</option>
                    </select>
                    <textarea id="custom-details" placeholder="Напишите свой комментарий..." rows="3" style="width:100%; display:none; margin-top:10px; font-size: 1em;"></textarea>
                </div>

                <label>Цена за выполнение (Звезды):</label>
                <input type="number" id="task-price" placeholder="0.25" min="0.01" step="0.01">
                
                <label>Количество выполнений:</label>
                <input type="number" id="task-count" placeholder="100" min="1">
            </div>
        `;
        
        // Динамическое отображение деталей комментария
        const taskTypeSelect = document.getElementById('task-type');
        const commentDetailsDiv = document.getElementById('comment-details');
        const taskDetailsSelect = document.getElementById('task-details');
        const customDetailsTextarea = document.getElementById('custom-details');

        taskTypeSelect.onchange = function() {
            commentDetailsDiv.style.display = this.value === 'comment' ? 'block' : 'none';
        };

        taskDetailsSelect.onchange = function() {
            customDetailsTextarea.style.display = this.value === 'custom' ? 'block' : 'none';
        };

        tg.MainButton.setText("Разместить Задание (Автоматическая модерация)");
        tg.MainButton.show();
        tg.MainButton.onClick(sendTaskData);
    }
    
    // Обработчик отправки данных о задании боту
    function sendTaskData() {
        const type = document.getElementById('task-type').value;
        const title = document.getElementById('task-title').value;
        const link = document.getElementById('task-link').value;
        const price = parseFloat(document.getElementById('task-price').value);
        const count = parseInt(document.getElementById('task-count').value);
        
        let details = '';
        if (type === 'comment') {
            const detailType = document.getElementById('task-details').value;
            if (detailType === 'custom') {
                details = document.getElementById('custom-details').value;
            } else {
                details = document.getElementById('task-details').options[document.getElementById('task-details').selectedIndex].text;
            }
        }
        
        if (!type || !title || !link || !price || !count || price <= 0 || count <= 0) {
            tg.showAlert("Пожалуйста, заполните все обязательные поля корректно.");
            return;
        }

        const totalCost = price * count;
        
        // Отправляем JSON-данные в Telegram-бот
        tg.sendData(JSON.stringify({
            action: 'create_task',
            type: type,
            title: title,
            link: link,
            details: details,
            price: price,
            count: count,
            total: totalCost
        }));
        
        // !!! ВАЖНО: После отправки данных не закрываем App, а возвращаемся в меню заказчика
        tg.showAlert(`Задание "${title}" отправлено на модерацию.`);
        renderCustomerMenu();
    }

    // Запускаем приложение с выбора режима
    // В реальном приложении здесь должна быть проверка, был ли профиль уже заполнен.
    // Пока всегда начинаем с выбора режима.
    renderModeSelection();
});