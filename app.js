// app.js

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Разворачиваем Mini App на весь экран

    const containers = {
        modeSelection: document.getElementById('mode-selection-container'),
        workerProfile: document.getElementById('worker-profile-container'),
        workerTasks: document.getElementById('worker-tasks-container'),
        customerMenu: document.getElementById('customer-menu-container'),
        createTask: document.getElementById('create-task-container'),
    };
    
    // --- 0. Управление отображением контейнеров ---
    function showContainer(containerName) {
        Object.values(containers).forEach(container => container.style.display = 'none');
        if (containers[containerName]) {
            containers[containerName].style.display = 'block';
        }
        tg.MainButton.hide();
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

        document.getElementById('btn-worker').onclick = () => {
            // Исполнитель: Сначала заполнение профиля
            renderWorkerProfile();
        };

        document.getElementById('btn-customer').onclick = () => {
            // Заказчик: Отправка данных боту (выдача бонуса/смена роли)
            tg.sendData(JSON.stringify({ action: 'set_customer_mode' }));
            // Переход к меню Заказчика
            renderCustomerMenu();
        };
    }

    // --- 2. Меню Исполнителя: Заполнение Профиля ---
    function renderWorkerProfile() {
        showContainer('workerProfile');
        containers.workerProfile.innerHTML = `
            <h2>Профиль Исполнителя</h2>
            <div class="card">
                <p>Для доступа к заданиям, заполните ваш профиль:</p>
                
                <label for="age">Возраст:</label>
                <input type="number" id="age" placeholder="25" min="16" max="99">
                
                <label for="gender">Пол:</label>
                <select id="gender">
                    <option value="">Выберите</option>
                    <option value="M">Мужской</option>
                    <option value="F">Женский</option>
                </select>
                
                <label for="country">Страна:</label>
                <input type="text" id="country" list="country-suggestions" placeholder="Россия">
                <datalist id="country-suggestions">
                    <option value="Россия">
                    <option value="Казахстан">
                    <option value="Украина">
                    <option value="Беларусь">
                </datalist>
            </div>
        `;
        
        // Главная кнопка для сохранения профиля
        tg.MainButton.setText("Сохранить и Смотреть Задания");
        tg.MainButton.show();
        tg.MainButton.onClick(saveWorkerProfile);
    }

    // Обработчик сохранения профиля (Имитация)
    function saveWorkerProfile() {
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const country = document.getElementById('country').value;

        if (!age || !gender || !country) {
            tg.showAlert("Пожалуйста, заполните все поля профиля.");
            return;
        }
        
        // Имитация отправки данных (здесь могла бы быть tg.sendData)
        tg.showAlert(`Профиль сохранен. Возраст: ${age}, Пол: ${gender}, Страна: ${country}`);
        
        // Переход к заданиям
        renderWorkerTasks();
    }


    // --- 3. Меню Исполнителя: Задания ---
    function renderWorkerTasks() {
        showContainer('workerTasks');
        // Имитация получения данных о заданиях
        const tasks = [
            { id: 1, title: "Подписка: Канал Profit Pro", price: 0.15, slots: 500 },
            { id: 2, title: "Комментарий: Оставить отзыв", price: 0.10, slots: 85 }
        ];

        let html = '<h2>Доступные Задания (Заработок)</h2>';
        tasks.forEach(task => {
            html += `
                <div class="card">
                    <strong>${task.title}</strong>
                    <p>Цена: ${task.price.toFixed(2)} Звезд | Осталось: ${task.slots}</p>
                    <button class="btn-primary" onclick="alert('Имитация выполнения задания ${task.id}')">Выполнить</button>
                </div>
            `;
        });
        containers.workerTasks.innerHTML = html;
        
        // Кнопка для возврата в главное меню
        tg.MainButton.setText("Вернуться к Выбору Режима");
        tg.MainButton.show();
        tg.MainButton.onClick(renderModeSelection);
    }
    
    // --- 4. Меню Заказчика ---
    function renderCustomerMenu() {
        showContainer('customerMenu');
        
        // Имитация активных заданий
        const activeTasks = [
            { title: "Подписка на канал", spent: 15.0, total: 50.0 },
            { title: "Лайки на пост", spent: 5.0, total: 20.0 }
        ];

        let activeTasksHtml = '<h3>📈 Ваши Активные Задания</h3>';
        activeTasks.forEach(task => {
            const progress = (task.spent / task.total) * 100;
            activeTasksHtml += `
                <div class="card">
                    <strong>${task.title}</strong>
                    <p>Потрачено: ${task.spent.toFixed(2)} Звезд из ${task.total.toFixed(2)} Звезд</p>
                    <div class="progress-bar">
                        <div class="progress" style="width:${progress}%;">${progress.toFixed(0)}%</div>
                    </div>
                </div>
            `;
        });
        
        containers.customerMenu.innerHTML = `
            <h2>Меню Заказчика (Продвижение)</h2>
            <div class="customer-menu">
                <button id="btn-create-task">➕ Создать Новое Задание</button>
                <button id="btn-deposit">💳 Пополнить Счет</button>
            </div>
            ${activeTasksHtml}
        `;
        
        document.getElementById('btn-create-task').onclick = renderCreateTask;
        document.getElementById('btn-deposit').onclick = () => tg.showAlert("Имитация пополнения счета.");
        
        // Кнопка для возврата в главное меню
        tg.MainButton.setText("Вернуться к Выбору Режима");
        tg.MainButton.show();
        tg.MainButton.onClick(renderModeSelection);
    }

    // --- 5. Меню Создания Задания ---
    function renderCreateTask() {
        showContainer('createTask');
        containers.createTask.innerHTML = `
            <h2>Создать Задание</h2>
            <div class="card">
                <label for="task-type">Тип задания:</label>
                <select id="task-type">
                    <option value="">Выберите тип</option>
                    <option value="subscribe">Подписаться</option>
                    <option value="comment">Оставить комментарий</option>
                </select>
                
                <label>Название задания:</label>
                <input type="text" id="task-title" placeholder="Подписка на канал">
                
                <label>Цена за выполнение (Звезды):</label>
                <input type="number" id="task-price" placeholder="0.25" min="0.01" step="0.01">
                
                <label>Количество выполнений:</label>
                <input type="number" id="task-count" placeholder="100" min="1">
            </div>
        `;

        tg.MainButton.setText("Разместить Задание (Отправить боту)");
        tg.MainButton.show();
        tg.MainButton.onClick(sendTaskData);
    }
    
    // Обработчик отправки данных о задании боту
    function sendTaskData() {
        const type = document.getElementById('task-type').value;
        const title = document.getElementById('task-title').value;
        const price = parseFloat(document.getElementById('task-price').value);
        const count = parseInt(document.getElementById('task-count').value);

        if (!type || !title || !price || !count || price <= 0 || count <= 0) {
            tg.showAlert("Пожалуйста, заполните все поля корректно.");
            return;
        }

        const totalCost = price * count;
        
        // Отправляем JSON-данные в Telegram-бот
        tg.sendData(JSON.stringify({
            action: 'create_task',
            type: type,
            title: title,
            price: price,
            count: count,
            total: totalCost
        }));
        
        tg.showAlert(`Задание "${title}" отправлено на размещение. Бот обработает запрос.`);
        tg.close(); // Закрываем Mini App после отправки
    }

    // Запускаем приложение с выбора режима
    renderModeSelection();
});