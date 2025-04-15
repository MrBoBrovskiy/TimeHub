/********************************
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 ********************************/

// Получаем строку для сегодняшней даты в формате "YYYY-MM-DD"
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

// Форматирование миллисекунд в строку "hh:mm:ss"
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

// Переводим часы/минуты/секунды обратно в миллисекунды (если понадобится)
// function parseTimeString(hhmmss) {
//   // Можно по желанию реализовать обратный парс
// }

// Считываем из localStorage объект со всеми данными
function loadData() {
  const json = localStorage.getItem('workData');
  return json ? JSON.parse(json) : {};
}

// Сохраняем объект с данными в localStorage
function saveData(data) {
  localStorage.setItem('workData', JSON.stringify(data));
}

/********************************
 * ПЕРЕМЕННЫЕ
 ********************************/

// Получаем ссылки на элементы страницы
const workTimerDisplay = document.getElementById('work-timer');
const lunchTimerDisplay = document.getElementById('lunch-timer');

const startWorkBtn = document.getElementById('start-work-btn');
const stopWorkBtn = document.getElementById('stop-work-btn');
const startLunchBtn = document.getElementById('start-lunch-btn');
const endLunchBtn = document.getElementById('end-lunch-btn');

// Для таймеров
let workStartTime = 0;    // когда начали/возобновили работу (ms)
let lunchStartTime = 0;   // когда начался обед (ms)

let accumulatedWorkTime = 0;   // накопленное рабочее время (ms)
let accumulatedLunchTime = 0;  // накопленное обеденное время (ms)

let workInterval = null;
let lunchInterval = null;

/********************************
 * ФУНКЦИИ ОБНОВЛЕНИЯ ТАЙМЕРОВ
 ********************************/

function updateWorkTimer() {
  const now = Date.now();
  const diff = now - workStartTime;
  const total = accumulatedWorkTime + diff;
  workTimerDisplay.textContent = formatTime(total);
}

function updateLunchTimer() {
  const now = Date.now();
  const diff = now - lunchStartTime;
  const total = accumulatedLunchTime + diff;
  lunchTimerDisplay.textContent = formatTime(total);
}

/********************************
 * СТАРТ РАБОЧЕГО ДНЯ
 ********************************/
startWorkBtn.addEventListener('click', () => {
  // Инициализируем время
  workStartTime = Date.now();
  // Запускаем интервал для обновления экрана каждую секунду
  workInterval = setInterval(updateWorkTimer, 1000);

  // Кнопки
  startWorkBtn.disabled = true;
  stopWorkBtn.disabled = false;
  startLunchBtn.disabled = false; // даём возможность начать обед
});

/********************************
 * НАЧАТЬ ОБЕД
 ********************************/
startLunchBtn.addEventListener('click', () => {
  // Останавливаем рабочий таймер, если он идёт
  if (workInterval) {
    clearInterval(workInterval);
    workInterval = null;
    // фиксируем, сколько накопили работы
    accumulatedWorkTime += Date.now() - workStartTime;
  }

  // Запускаем обеденный таймер
  lunchStartTime = Date.now();
  lunchInterval = setInterval(updateLunchTimer, 1000);

  // Кнопки
  startLunchBtn.disabled = true;
  endLunchBtn.disabled = false;
});

/********************************
 * ЗАКОНЧИТЬ ОБЕД
 ********************************/
endLunchBtn.addEventListener('click', () => {
  // Останавливаем обеденный таймер
  if (lunchInterval) {
    clearInterval(lunchInterval);
    lunchInterval = null;
    // фиксируем, сколько накопили обеда
    accumulatedLunchTime += Date.now() - lunchStartTime;
  }

  // Возобновляем рабочий таймер
  workStartTime = Date.now();
  workInterval = setInterval(updateWorkTimer, 1000);

  // Кнопки
  endLunchBtn.disabled = true;
  startLunchBtn.disabled = false;
});

/********************************
 * ЗАКОНЧИТЬ РАБОЧИЙ ДЕНЬ
 ********************************/
stopWorkBtn.addEventListener('click', () => {
  // Если рабочий таймер всё ещё идёт – останавливаем
  if (workInterval) {
    clearInterval(workInterval);
    workInterval = null;
    accumulatedWorkTime += Date.now() - workStartTime;
  }

  // Если вдруг идёт обеденный таймер – тоже останавливаем
  if (lunchInterval) {
    clearInterval(lunchInterval);
    lunchInterval = null;
    accumulatedLunchTime += Date.now() - lunchStartTime;
  }

  // Сохраняем данные за сегодня
  const today = getTodayDate();
  const data = loadData();

  // Создаём/обновляем запись на сегодня
  data[today] = {
    workTime: (data[today]?.workTime || 0) + accumulatedWorkTime,
    lunchTime: (data[today]?.lunchTime || 0) + accumulatedLunchTime
  };

  saveData(data);

  // Сбрасываем переменные
  accumulatedWorkTime = 0;
  accumulatedLunchTime = 0;
  workTimerDisplay.textContent = "00:00:00";
  lunchTimerDisplay.textContent = "00:00:00";

  // Кнопки
  startWorkBtn.disabled = false;
  stopWorkBtn.disabled = true;
  startLunchBtn.disabled = true;
  endLunchBtn.disabled = true;

  // Обновим таблицу
  renderWeekTable();
});

/********************************
 * РЕНДЕР ТАБЛИЦЫ ЗА НЕДЕЛЮ
 ********************************/
function renderWeekTable() {
  const data = loadData();

  // Определим "текущую неделю":  
  // Предположим, что "сегодня" – это дата, находим понедельник и воскресенье вокруг неё
  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay(); 
  // В JS воскресенье = 0, понедельник = 1, ..., суббота = 6.
  // Для удобства считаем, что хотим понедельник–воскресенье.
  // dayOfWeek==1 -> сегодня понедельник, значит startOfWeek = сегодня
  // dayOfWeek==2 -> сегодня вторник, значит startOfWeek = сегодня - 1 день
  // и т.д.
  // Но если 0 (воскресенье) -> startOfWeek = сегодня - 6 дней

  // Найдём, сколько дней нужно вычесть, чтобы получить понедельник
  // Если dayOfWeek == 0 (вс), то нужно вычесть 6
  // Иначе dayOfWeek - 1
  const diffToMonday = dayOfWeek === 0 ? 6 : (dayOfWeek - 1);

  // Старт недели (понедельник)
  const startOfWeekDate = new Date(todayDate);
  startOfWeekDate.setDate(todayDate.getDate() - diffToMonday);

  // Собираем массив из 7 дней (понедельник -> воскресенье)
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeekDate);
    d.setDate(startOfWeekDate.getDate() + i);
    daysOfWeek.push(d);
  }

  // Очищаем tbody
  const tbody = document.querySelector('#week-table tbody');
  tbody.innerHTML = '';

  // Для каждого дня рисуем строку
  daysOfWeek.forEach((dateObj) => {
    const yyyymmdd = dateObj.toISOString().slice(0, 10);
    const row = document.createElement('tr');

    // Дата
    const tdDate = document.createElement('td');
    tdDate.textContent = yyyymmdd; 
    row.appendChild(tdDate);

    // Достаём из data
    const dayData = data[yyyymmdd] || { workTime: 0, lunchTime: 0 };
    const workTimeFormatted = formatTime(dayData.workTime);
    const lunchTimeFormatted = formatTime(dayData.lunchTime);

    // Рабочее время
    const tdWork = document.createElement('td');
    tdWork.textContent = workTimeFormatted;
    row.appendChild(tdWork);

    // Обеденное время
    const tdLunch = document.createElement('td');
    tdLunch.textContent = lunchTimeFormatted;
    row.appendChild(tdLunch);

    // Добавляем строку в таблицу
    tbody.appendChild(row);
  });
}

/********************************
 * ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
 ********************************/
window.addEventListener('load', () => {
  // При старте страницы отключим лишние кнопки (состояние «ничего не запущено»)
  stopWorkBtn.disabled = true;
  startLunchBtn.disabled = true;
  endLunchBtn.disabled = true;

  // Рендерим таблицу за неделю
  renderWeekTable();
});

// Находим кнопку
const resetBtn = document.getElementById('reset-btn');

resetBtn.addEventListener('click', () => {
  const confirmation = confirm("Вы действительно хотите сбросить все данные?");
  if (confirmation) {
    // Удаляем все данные из localStorage по ключу 'workData'
    localStorage.removeItem('workData');

    // Сбрасываем переменные (если нужно)
    accumulatedWorkTime = 0;
    accumulatedLunchTime = 0;
    workTimerDisplay.textContent = "00:00:00";
    lunchTimerDisplay.textContent = "00:00:00";

    // Останавливаем возможные таймеры
    if (workInterval) {
      clearInterval(workInterval);
      workInterval = null;
    }
    if (lunchInterval) {
      clearInterval(lunchInterval);
      lunchInterval = null;
    }

    // Также, на всякий случай, отключим кнопки, вернув всё к начальному состоянию
    startWorkBtn.disabled = false;
    stopWorkBtn.disabled = true;
    startLunchBtn.disabled = true;
    endLunchBtn.disabled = true;

    // Перерисуем таблицу
    renderWeekTable();
  }
});

/*******************************
 * БЛОК: УПРАВЛЕНИЕ ЗАДАЧАМИ
 ******************************/

// 1. Селекторы
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksTableBody = document.querySelector('#tasks-table tbody');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// 2. Загрузка задач из localStorage
function loadTasks() {
  const tasksJson = localStorage.getItem('taskData');
  return tasksJson ? JSON.parse(tasksJson) : [];
}

// 3. Сохранение задач в localStorage
function saveTasks(tasks) {
  localStorage.setItem('taskData', JSON.stringify(tasks));
}

// 4. Рендер таблицы с задачами
function renderTasks() {
  const tasks = loadTasks();

  // Очищаем текущие строки
  tasksTableBody.innerHTML = '';

  tasks.forEach((task) => {
    // Создаём строку
    const row = document.createElement('tr');

    // 1) Ячейка с чекбоксом
    const checkboxTd = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      // Изменяем статус задачи
      task.completed = checkbox.checked;
      saveTasks(tasks);
      // Можно визуально помечать выполненные
      textTd.style.textDecoration = task.completed ? 'line-through' : 'none';
    });
    checkboxTd.appendChild(checkbox);
    row.appendChild(checkboxTd);

    // 2) Ячейка с текстом задачи
    const textTd = document.createElement('td');
    textTd.textContent = task.text;
    if (task.completed) {
      textTd.style.textDecoration = 'line-through';
    }
    row.appendChild(textTd);

    // 3) Ячейка с кнопкой "Удалить"
    const deleteTd = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Удалить';
    deleteBtn.style.backgroundColor = '#555';
    deleteBtn.style.color = '#fff';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '4px';
    deleteBtn.style.padding = '5px 10px';
    deleteBtn.style.cursor = 'pointer';

    deleteBtn.addEventListener('click', () => {
      // Удаляем задачу из массива
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks.splice(index, 1);
        saveTasks(tasks);
        renderTasks(); // Перерисовываем
      }
    });

    deleteTd.appendChild(deleteBtn);
    row.appendChild(deleteTd);

    tasksTableBody.appendChild(row);
  });
}

// 5. Событие на кнопку "Добавить задачу"
addTaskBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  if (!text) return; // если пустой ввод - не добавляем

  // Загружаем текущий массив
  const tasks = loadTasks();

  // Создаём новую задачу
  const newTask = {
    id: Date.now(), // уникальный ID (на коленке)
    text,
    completed: false
  };

  // Добавляем и сохраняем
  tasks.push(newTask);
  saveTasks(tasks);

  // Очищаем поле ввода
  taskInput.value = '';

  // Обновляем отображение
  renderTasks();
});

// 6. "Удалить все выполненные"
clearCompletedBtn.addEventListener('click', () => {
  const confirmation = confirm("Удалить ВСЕ выполненные задачи?");
  if (confirmation) {
    let tasks = loadTasks();
    tasks = tasks.filter(task => !task.completed); // Оставляем только невыполненные
    saveTasks(tasks);
    renderTasks();
  }
});

// 7. При загрузке страницы рендерим существующие задачи
window.addEventListener('load', () => {
  renderTasks();
});
