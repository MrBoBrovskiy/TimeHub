/*********************************
 * ПЕРЕМЕННЫЕ и ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 *********************************/
const addTaskBtn = document.getElementById('add-task-btn');
const newTaskTitleInput = document.getElementById('new-task-title');

const columns = document.querySelectorAll('.column .dropzone');
// Это наши зоны: todo, waiting, done

// Функция для чтения/записи массива задач в localStorage
function loadTasks() {
  const json = localStorage.getItem('kanbanTasks');
  return json ? JSON.parse(json) : [];
}

function saveTasks(tasks) {
  localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

// Генерация уникального ID
function generateId() {
  return Date.now() + '-' + Math.floor(Math.random() * 1000);
}

/*********************************
 * ОТРИСОВКА КАРТОЧЕК
 *********************************/
function renderTasks() {
  // Считываем задачи
  const tasks = loadTasks();

  // Очищаем все dropzone перед рендером (убираем старые карточки)
  columns.forEach((zone) => {
    zone.innerHTML = '';
  });

  // Для каждой задачи создаём div-карточку и вставляем в нужную колонку
  tasks.forEach((task) => {
    const card = document.createElement('div');
    card.classList.add('task-card');
    card.setAttribute('draggable', 'true'); // чтобы работал Drag&Drop
    card.dataset.id = task.id; // храним id в data-атрибуте
    card.textContent = task.title;

    // При начале перетаскивания
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      // передаём id карточки
      e.dataTransfer.setData('text/plain', task.id);
    });

    // При окончании перетаскивания
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    // Вставляем карточку в нужную колонку
    const columnElement = document.querySelector(`[data-column="${task.column}"] .dropzone`);
    if (columnElement) {
      columnElement.appendChild(card);
    }
  });
}

/*********************************
 * СОБЫТИЯ ДЛЯ ДОБАВЛЕНИЯ ЗАДАЧИ
 *********************************/
addTaskBtn.addEventListener('click', () => {
  const title = newTaskTitleInput.value.trim();
  if (!title) return;

  const tasks = loadTasks();
  const newTask = {
    id: generateId(),
    title,
    column: 'todo'  // по умолчанию кладём в колонку "todo" (т.е. "В работе")
  };

  tasks.push(newTask);
  saveTasks(tasks);
  newTaskTitleInput.value = '';

  renderTasks();
});

/*********************************
 * НАСТРОЙКА DRAG & DROP на колонках
 *********************************/
// Для каждой .dropzone (каждой колонки) нужно подписаться на события dragover, drop

columns.forEach((zone) => {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    // Разрешаем бросать в эту зону
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    // Получаем id карточки, которую перетаскиваем
    const taskId = e.dataTransfer.getData('text/plain');
    // Определяем, к какой колонке относится эта zone
    const columnType = zone.parentElement.dataset.column;

    // Обновляем у задачи column
    const tasks = loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].column = columnType;
      saveTasks(tasks);
    }

    // Перерисовываем
    renderTasks();
  });
});

/*********************************
 * ИНИЦИАЛИЗАЦИЯ
 *********************************/
window.addEventListener('load', () => {
  renderTasks();
});

// Находим кнопку "Очистить все выполненные"
const clearDoneBtn = document.getElementById('clear-done-btn');

clearDoneBtn.addEventListener('click', () => {
  const confirmation = confirm("Удалить ВСЕ задачи из колонки 'Выполнено'?");
  if (confirmation) {
    let tasks = loadTasks();
    // Оставляем только те, которые не 'done'
    tasks = tasks.filter(task => task.column !== 'done');
    saveTasks(tasks);
    renderTasks();
  }
});
