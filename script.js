/********************************
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 ********************************/

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

/********************************
 * ПЕРЕМЕННЫЕ ДЛЯ ТАЙМЕРОВ
 ********************************/

// Элементы для таймера
const workTimerDisplay = document.getElementById('work-timer');
const lunchTimerDisplay = document.getElementById('lunch-timer');

const startWorkBtn = document.getElementById('start-work-btn');
const stopWorkBtn = document.getElementById('stop-work-btn');
const startLunchBtn = document.getElementById('start-lunch-btn');
const endLunchBtn = document.getElementById('end-lunch-btn');

// Итог за сегодня (показываем после "Закончить рабочий день")
const todayWorkResult = document.getElementById('today-work-duration');

let workStartTime = 0;       // когда запущен рабочий таймер (ms)
let lunchStartTime = 0;      // когда запущен обеденный таймер (ms)

let accumulatedWorkTime = 0; // накопленное рабочее время (ms)
let accumulatedLunchTime = 0;// накопленное обеденное время (ms)

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
 * НАЧАТЬ РАБОЧИЙ ДЕНЬ
 ********************************/
startWorkBtn.addEventListener('click', () => {
  // Сбрасываем итог за прошлый день (если был) в интерфейсе
  todayWorkResult.textContent = '--:--:--';

  // Инициализируем время
  workStartTime = Date.now();
  // Запускаем интервал для обновления экрана каждую секунду
  workInterval = setInterval(updateWorkTimer, 1000);

  // Кнопки
  startWorkBtn.disabled = true;
  stopWorkBtn.disabled = false;
  startLunchBtn.disabled = false;
});

/********************************
 * НАЧАТЬ ОБЕД
 ********************************/
startLunchBtn.addEventListener('click', () => {
  // Останавливаем рабочий таймер, если он идёт
  if (workInterval) {
    clearInterval(workInterval);
    workInterval = null;
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
  // Если рабочий таймер ещё идёт, останавливаем
  if (workInterval) {
    clearInterval(workInterval);
    workInterval = null;
    accumulatedWorkTime += Date.now() - workStartTime;
  }

  // Если идёт обеденный таймер, тоже остановим
  if (lunchInterval) {
    clearInterval(lunchInterval);
    lunchInterval = null;
    accumulatedLunchTime += Date.now() - lunchStartTime;
  }

  // Итог за сегодня:
  // Просто время, которое мы накопили в accumulatedWorkTime (без учёта обеда).
  // Или, если хочешь, можно "обед" не вычитать, тогда sum=accumulatedWorkTime
  const finalMs = accumulatedWorkTime;
  // форматируем
  const finalStr = formatTime(finalMs);
  // Пишем на экран
  todayWorkResult.textContent = finalStr;

  // Сбрасываем таймеры в 00:00:00
  accumulatedWorkTime = 0;
  accumulatedLunchTime = 0;
  workTimerDisplay.textContent = '00:00:00';
  lunchTimerDisplay.textContent = '00:00:00';

  // Кнопки
  startWorkBtn.disabled = false;
  stopWorkBtn.disabled = true;
  startLunchBtn.disabled = true;
  endLunchBtn.disabled = true;
});

/********************************
 * КНОПКА СБРОСА (RESET)
 ********************************/
const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
  const confirmation = confirm("Вы действительно хотите сбросить все данные?");
  if (confirmation) {
    // Сбрасываем переменные
    accumulatedWorkTime = 0;
    accumulatedLunchTime = 0;
    workTimerDisplay.textContent = "00:00:00";
    lunchTimerDisplay.textContent = "00:00:00";
    todayWorkResult.textContent = '--:--:--';

    // Останавливаем возможные таймеры
    if (workInterval) {
      clearInterval(workInterval);
      workInterval = null;
    }
    if (lunchInterval) {
      clearInterval(lunchInterval);
      lunchInterval = null;
    }

    // Возвращаем кнопки в начальное состояние
    startWorkBtn.disabled = false;
    stopWorkBtn.disabled = true;
    startLunchBtn.disabled = true;
    endLunchBtn.disabled = true;

    // (Тут можно также сбросить задачи, если надо, но сейчас логика отделена)
  }
});

/********************************
 * ЛОГИКА СПИСКА ЗАДАЧ
 ********************************/
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksTableBody = document.querySelector('#tasks-table tbody');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// Загрузка задач из localStorage (под ключом "taskData")
function loadTasks() {
  const tasksJson = localStorage.getItem('taskData');
  return tasksJson ? JSON.parse(tasksJson) : [];
}

// Сохранение задач
function saveTasks(tasks) {
  localStorage.setItem('taskData', JSON.stringify(tasks));
}

// Рендер таблицы с задачами
function renderTasks() {
  const tasks = loadTasks();
  tasksTableBody.innerHTML = '';

  tasks.forEach((task) => {
    const row = document.createElement('tr');

    // Чекбокс
    const checkboxTd = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveTasks(tasks);
      textTd.style.textDecoration = task.completed ? 'line-through' : 'none';
    });
    checkboxTd.appendChild(checkbox);
    row.appendChild(checkboxTd);

    // Текст задачи
    const textTd = document.createElement('td');
    textTd.textContent = task.text;
    if (task.completed) {
      textTd.style.textDecoration = 'line-through';
    }
    row.appendChild(textTd);

    // Кнопка "Удалить"
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
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks.splice(index, 1);
        saveTasks(tasks);
        renderTasks();
      }
    });

    deleteTd.appendChild(deleteBtn);
    row.appendChild(deleteTd);

    tasksTableBody.appendChild(row);
  });
}

// Добавление новой задачи
addTaskBtn.addEventListener('click', () => {
  const text = taskInput.value.trim();
  if (!text) return;

  const tasks = loadTasks();
  const newTask = {
    id: Date.now(),
    text,
    completed: false
  };
  tasks.push(newTask);
  saveTasks(tasks);

  taskInput.value = '';
  renderTasks();
});

// Удалить все выполненные
clearCompletedBtn.addEventListener('click', () => {
  const confirmation = confirm("Удалить ВСЕ выполненные задачи?");
  if (confirmation) {
    let tasks = loadTasks();
    tasks = tasks.filter(task => !task.completed);
    saveTasks(tasks);
    renderTasks();
  }
});

// При загрузке страницы
window.addEventListener('load', () => {
  // Изначально кнопки «остановить»/«обед» выключены
  stopWorkBtn.disabled = true;
  startLunchBtn.disabled = true;
  endLunchBtn.disabled = true;

  // Рендерим задачи
  renderTasks();
});

/********************************
 * Калькулятор
 ********************************/
const calcInput = document.getElementById('calc-input');
const calcOneThird = document.getElementById('calc-one-third');
const calcTwoThirds = document.getElementById('calc-two-thirds');

calcInput.addEventListener('input', () => {
  const val = calcInput.value.trim();
  if (!val) {
    calcOneThird.textContent = '—';
    calcTwoThirds.textContent = '—';
    return;
  }
  const num = parseFloat(val);
  if (isNaN(num)) {
    calcOneThird.textContent = 'Ошибка';
    calcTwoThirds.textContent = 'Ошибка';
    return;
  }
  // Можно регулировать toFixed(2) или (0) - как удобнее
  calcOneThird.textContent = (num / 3).toFixed(0);
  calcTwoThirds.textContent = ((2 * num) / 3).toFixed(0);
});
