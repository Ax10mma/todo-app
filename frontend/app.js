const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCounter = document.getElementById("taskCounter");
const clearCompleted = document.getElementById("clearCompleted");
const filters = document.querySelectorAll(".filter");

let tasks = [];
let currentFilter = "all";

// API
async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");

        if (!response.ok) {
            throw new Error("Не вдалося завантажити завдання");
        }

        tasks = await response.json();

        renderTasks();

    } catch (error) {
        console.error(error);

        // Якщо сервер недоступний,
        // використовуємо localStorage
        loadFromLocalStorage();
    }
}

async function addTask(title) {
    try {
        const response = await fetch("/api/tasks", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: title
            })
        });

        if (!response.ok) {
            throw new Error("Помилка додавання");
        }

        const task = await response.json();

        tasks.push(task);

        saveToLocalStorage();

        renderTasks();

    } catch (error) {
        console.error(error);

        // Fallback на localStorage
        const task = {
            id: Date.now().toString(),
            title: title,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);

        saveToLocalStorage();
        renderTasks();
    }
}

async function toggleTask(id) {

    try {

        const response = await fetch(`/api/tasks/${id}`, {
            method: "PATCH"
        });

        if (!response.ok) {
            throw new Error("Помилка зміни статусу");
        }

        const updatedTask = await response.json();

        tasks = tasks.map(task =>
            task.id === id ? updatedTask : task
        );

        saveToLocalStorage();
        renderTasks();

    } catch (error) {

        console.error(error);

        tasks = tasks.map(task => {

            if (task.id === id) {
                return {
                    ...task,
                    completed: !task.completed
                };
            }

            return task;
        });

        saveToLocalStorage();
        renderTasks();
    }
}

async function deleteTask(id) {

    try {

        const response = await fetch(`/api/tasks/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Помилка видалення");
        }

        tasks = tasks.filter(task => task.id !== id);

        saveToLocalStorage();
        renderTasks();

    } catch (error) {

        console.error(error);

        tasks = tasks.filter(task => task.id !== id);

        saveToLocalStorage();
        renderTasks();
    }
}

// localStorage
function saveToLocalStorage() {
    localStorage.setItem(
        "todoTasks",
        JSON.stringify(tasks)
    );
}

function loadFromLocalStorage() {

    const savedTasks = localStorage.getItem("todoTasks");

    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        tasks = [];
    }

    renderTasks();
}

// Render
function renderTasks() {

    taskList.innerHTML = "";

    let filteredTasks = tasks;

    if (currentFilter === "active") {

        filteredTasks = tasks.filter(
            task => !task.completed
        );

    } else if (currentFilter === "completed") {

        filteredTasks = tasks.filter(
            task => task.completed
        );
    }

    if (filteredTasks.length === 0) {

        const emptyMessage = document.createElement("li");

        emptyMessage.className = "empty";

        emptyMessage.textContent =
            "Завдань поки немає";

        taskList.appendChild(emptyMessage);

    } else {

        filteredTasks.forEach(task => {

            const li = document.createElement("li");

            li.className = "task";

            if (task.completed) {
                li.classList.add("completed");
            }

            const checkbox =
                document.createElement("input");

            checkbox.type = "checkbox";
            checkbox.className = "task-checkbox";
            checkbox.checked = task.completed;

            checkbox.addEventListener(
                "change",
                () => toggleTask(task.id)
            );

            const title =
                document.createElement("span");

            title.className = "task-title";
            title.textContent = task.title;

            const deleteButton =
                document.createElement("button");

            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Видалити";

            deleteButton.addEventListener(
                "click",
                () => deleteTask(task.id)
            );

            li.appendChild(checkbox);
            li.appendChild(title);
            li.appendChild(deleteButton);

            taskList.appendChild(li);
        });
    }

    updateCounter();
}

function updateCounter() {

    const activeTasks =
        tasks.filter(task => !task.completed).length;

    taskCounter.textContent =
        `Залишилося завдань: ${activeTasks}`;
}

// Events
taskForm.addEventListener("submit", async event => {

    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        alert("Введіть текст завдання");
        return;
    }

    await addTask(title);

    taskInput.value = "";
    taskInput.focus();
});

filters.forEach(filter => {

    filter.addEventListener("click", () => {

        filters.forEach(button =>
            button.classList.remove("active")
        );

        filter.classList.add("active");

        currentFilter =
            filter.dataset.filter;

        renderTasks();
    });
});

clearCompleted.addEventListener("click", async () => {

    const completedTasks =
        tasks.filter(task => task.completed);

    for (const task of completedTasks) {
        await deleteTask(task.id);
    }
});

// Запуск програми
loadTasks();