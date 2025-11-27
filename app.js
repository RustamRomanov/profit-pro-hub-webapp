// app.js

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); 
    
    // Имитация статуса профиля (в реальной версии получаем от бэкенда)
    let isProfileFilled = false;

    const containers = {
        workerTasks: document.getElementById('worker-tasks-container'),
        customerMenu: document.getElementById('customer-menu-container'),
        createTask: document.getElementById('create-task-container'),
        profile: document.getElementById('profile-container'),
    };
    
    const tabBar = document.querySelector('.tab-bar');
    const tabItems = document.querySelectorAll('.tab-item');
    const profileModal = document.getElementById('profile-modal');
    
    // --- Данные для Списков ---
    const COUNTRIES = [
        "Россия", "Украина", "Казахстан", "Беларусь", "Узбекистан", "Армения", 
        "Грузия", "Азербайджан", "Молдова", "Кыргызстан", "Таджикистан", 
        "Туркменистан", "Латвия", "Литва", "Эстония"
    ].sort();

    // --- 0. Управление отображением контейнеров ---
    function showContainer(containerName) {
        // Скрываем все контейнеры
        Object.values(containers).forEach(container => container.style.display = 'none');
        // Показываем нужный
        if (containers[containerName]) {
            containers[containerName].style.display = 'block';
        }
        tg.MainButton.hide(); 
        
        // Переключаем активный таб
        tabItems.forEach(item => {
            if (item.getAttribute('data-target') === containerName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Перезапуск рендера для активного контейнера
        if (containerName === 'workerTasks') renderWorkerTasks();
        if (containerName === 'customerMenu') renderCustomerMenu();
        if (containerName === 'profile') renderProfile();
        if (containerName === 'createTask') renderCreateTask();
    }
    
    // --- 0.1 Обработка навигации по Tab Bar ---
    tabItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            showContainer(target);
        });
    });

    // --- 1. Рендер Меню Исполнителя: ЗАДАНИЯ (ПО УМОЛЧАНИЮ) ---
    function renderWorkerTasks() {
        // Имитация баланса и заданий
        const currentBalance = 5.25; 
        const tasks = [
            { id: 1, title: "Подписка: VIP-канал", price: 0.50, slots: 100, type: 'subscribe' },
            { id: 2, title: "Комментарий: Оставить отзыв", price: 0.35, slots: 85, type: 'comment' },
            { id: 3, title: "Подписка: Новый канал (Срочно!)", price: 0.15, slots: 500, type: 'subscribe' },
            { id: 4, title: "Реакция: 5 лайков", price: 0.10, slots: 1000, type: 'reaction' },
            { id: 5, title: "Комментарий: Вопрос по теме", price: 0.40, slots: 50, type: 'comment' },
            { id: 6, title: "Подписка: Игровой канал", price: 0.25, slots: 300, type: 'subscribe' },
            { id: 7, title: "Репост в 5 чатов", price: 0.60, slots: 20, type: 'repost' },
            { id: 8, title: "Комментарий: Длинный текст", price: 0.80, slots: 10, type: 'comment' },
            { id: 9, title: "Подписка: Блоггер", price: 0.20, slots: 400, type: 'subscribe' },
            { id: 10, title: "Реакция: 10 дизлайков", price: 0.05, slots: 2000, type: 'reaction' },
        ];
        
        tasks.sort((a, b) => b.price - a.price);

        let tasksHtml = '';
        tasks.forEach(task => {
            tasksHtml += `
                <div class="card task-card" data-task-id="${task.id}">
                    <strong>${task.title}</strong>
                    <p>Цена: ${task.price.toFixed(2)} Звезд | Осталось: ${task.slots} слотов</p>
                    <button class="btn-primary btn-do-task" data-task-id="${task.id}">Выполнить</button>
                </div>
            `;
        });
        
        containers.workerTasks.innerHTML = `
            <h2>💳 Выполнить Задание</h2>
            <div class="card" style="text-align: center; margin-bottom: 20px;">
                 Активный Баланс: <strong>${currentBalance.toFixed(2)} Звезд</strong>
            </div>
            ${tasksHtml}
        `;
        
        // Добавление обработчиков клика на кнопки "Выполнить"
        document.querySelectorAll('.btn-do-task').forEach(button => {
            button.onclick = (e) => {
                e.stopPropagation();
                if (!isProfileFilled) {
                    showModal('profile-modal');
                } else {
                    tg.showAlert(`Имитация выполнения задания ${e.target.dataset.taskId}.`);
                }
            };
        });
    }
    
    // --- 2. Рендер Меню Заказчика: СОЗДАТЬ ---
    function renderCustomerMenu() {
        // Имитация активных заданий
        const currentBalance = 100.00;
        const activeTasks = [
            { id: 101, title: "Подписка на канал (активно)", spent: 15.0, total: 50.0, percent: (15/50)*100 },
            { id: 102, title: "Лайки на пост (активно)", spent: 5.0, total: 20.0, percent: (5/20)*100 }
        ];

        let activeTasksHtml = '<h3>📈 Активные Задания</h3>';
        if (activeTasks.length === 0) {
             activeTasksHtml += '<div class="card"><p>У вас нет активных заданий.</p></div>';
        } else {
            activeTasks.forEach(task => {
                activeTasksHtml += `
                    <div class="card">
                        <strong>${task.title}</strong>
                        <p>Потрачено: ${task.spent.toFixed(2)} Звезд / Бюджет: ${task.total.toFixed(2)} Звезд</p>
                        <div class="progress-bar">
                            <div class="progress" style="width:${Math.max(task.percent, 5)}%;">${task.percent.toFixed(0)}%</div>
                        </div>
                    </div>
                `;
            });
        }
        
        containers.customerMenu.innerHTML = `
            <h2>📣 Создать</h2>
            <div class="card" style="text-align: center; margin-bottom: 20px;">
                Баланс: <span class="balance-link" onclick="handleBalanceClick('customer')">${currentBalance.toFixed(2)} Звезд</span>
            </div>

            <button id="btn-create-task" class="btn-primary" style="margin-bottom: 15px;">➕ Создать Новое Задание</button>
            
            ${activeTasksHtml}

            <h3>🕒 История Заданий</h3>
            <div class="card" style="text-align: center;"><p>История выполненных и завершенных заданий будет здесь.</p></div>
        `;
        
        document.getElementById('btn-create-task').onclick = () => showContainer('createTask');
    }
    
    // --- 3. Рендер Формы Создания Задания ---
    function renderCreateTask() {
         // Сохраняем текущий MainButton, чтобы вернуться к нему после размещения
         tg.MainButton.hide();
         
         // Здесь используется более компактный стиль ввода
         containers.createTask.innerHTML = `
            <h2>Создать Задание</h2>
            <div class="card">
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
                
                <div id="comment-details" style="display:none;">
                    <label>Детали задания (для комментариев):</label>
                    <select id="task-details">
                        <option value="default">Оставьте комментарий - отзыв о моем новом луке осень-зима.</option>
                        <option value="custom">Написать свой вариант задания</option>
                    </select>
                    <textarea id="custom-details" placeholder="Напишите свой комментарий..." rows="3" style="width:100%; display:none;"></textarea>
                </div>

                <div class="select-group">
                    <div>
                        <label>Цена за выполнение (Звезды):</label>
                        <input type="number" id="task-price" placeholder="0.25" min="0.01" step="0.01" required>
                    </div>
                    <div>
                        <label>Количество выполнений:</label>
                        <input type="number" id="task-count" placeholder="100" min="1" required>
                    </div>
                </div>
            </div>
        `;
        
        // Логика динамического отображения деталей
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

        tg.MainButton.setText("Разместить Задание (С модерацией)");
        tg.MainButton.show();
        tg.MainButton.onClick(sendTaskData);
        
        // Переопределяем нажатие на MainButton для возврата в меню заказчика
        tg.onEvent('mainButtonClicked', sendTaskData); 
    }
    
    // --- 4. Рендер Меню ПРОФИЛЬ ---
    function renderProfile() {
        // Имитация данных (должны быть получены из БД)
        const profileData = { 
            age: 25, 
            gender: 'M', 
            country: 'Россия',
            balance: 5.25,
            filled: isProfileFilled 
        }; 

        // Генерация опций для селектора возраста
        const ageOptions = generateOptions(16, 99, profileData.age);
        const countryOptions = generateCountryOptions(COUNTRIES, profileData.country);
        
        let status = profileData.filled ? 
            '✅ Профиль заполнен' : 
            '⚠️ Профиль не заполнен. Заполните, чтобы выполнять задания.';

        containers.profile.innerHTML = `
            <h2>👤 Профиль</h2>

            <div class="card" style="text-align: center;">
                <h3>Баланс: <span class="balance-link" onclick="handleBalanceClick('worker')">${profileData.balance.toFixed(2)} Звезд</span></h3>
                <small>${status}</small>
            </div>
            
            <h3>Анкета Исполнителя</h3>
            <div class="card">
                <div class="select-group">
                    <div>
                        <label for="age">Возраст (16-99):</label>
                        <select id="age" required>${ageOptions}</select>
                    </div>
                    <div>
                        <label for="gender">Пол:</label>
                        <select id="gender" required>
                            <option value="">Выберите</option>
                            <option value="M" ${profileData.gender === 'M' ? 'selected' : ''}>Мужской</option>
                            <option value="F" ${profileData.gender === 'F' ? 'selected' : ''}>Женский</option>
                        </select>
                    </div>
                </div>
                
                <label for="country">Страна:</label>
                <select id="country" required>
                    ${countryOptions}
                </select>
            </div>

            <button id="btn-save-profile" class="btn-primary">Сохранить Профиль</button>

            <h3>🕒 История Выполненных Заданий</h3>
            <div class="card" style="text-align: center;"><p>Ваша история заработка будет здесь.</p></div>
        `;
        
        document.getElementById('btn-save-profile').onclick = saveProfile;
        
        // Устанавливаем MainButton для сохранения
        tg.MainButton.setText("Сохранить Профиль");
        tg.MainButton.show();
        tg.MainButton.onClick(saveProfile);
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
        let options = '<option value="">Выберите страну</option>';
        countries.forEach(country => {
            options += `<option value="${country}" ${country === selected ? 'selected' : ''}>${country}</option>`;
        });
        return options;
    }
    
    // --- Обработчики Действий ---
    
    function showModal(id) {
        document.getElementById(id).style.display = 'flex';
    }

    function hideModal(id) {
        document.getElementById(id).style.display = 'none';
    }
    
    // Обработчик сохранения профиля
    function saveProfile() {
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
            // 💡 ИСПРАВЛЕНО: удалено лишнее 'gender:'
            gender: gender, 
            country: country
        }));
        
        isProfileFilled = true; // Устанавливаем флаг локально
        tg.showMiniApp({ animation: true }); // Имитация красивой анимации
        tg.showAlert(`Профиль сохранен. Спасибо!`);
        renderProfile(); // Перерендеринг профиля для отображения статуса
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
        
        // После отправки данных остаемся в меню Заказчика
        tg.showAlert(`Задание "${title}" отправлено на модерацию. Списано ${totalCost.toFixed(2)} Звезд.`);
        showContainer('customerMenu');
    }

    // Обработчик нажатия на баланс (общий)
    window.handleBalanceClick = function(role) {
        // Здесь можно добавить анимацию звука, например: tg.HapticFeedback.notificationOccurred('success');
        if (role === 'worker') {
            tg.showAlert("Меню Вывода Средств (Имитация).");
        } else {
            tg.showAlert("Меню Пополнения и Вывода Средств (Имитация).");
        }
    };
    
    // Обработчик модального окна
    document.getElementById('modal-close').onclick = () => hideModal('profile-modal');
    document.getElementById('modal-goto-profile').onclick = () => {
        hideModal('profile-modal');
        showContainer('profile'); // Переход во вкладку Профиль
    };


    // Запуск приложения: начинаем с вкладки "Выполнить"
    showContainer('workerTasks');
});