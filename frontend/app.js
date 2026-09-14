const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dateInput = document.getElementById("dateInput");

const taskList = document.getElementById("taskList");
const taskCounter = document.getElementById("taskCounter");

const searchInput = document.getElementById("searchInput");

const filters = document.querySelectorAll(".filter");

const clearCompleted =
    document.getElementById("clearCompleted");

const totalTasks =
    document.getElementById("totalTasks");

const activeTasks =
    document.getElementById("activeTasks");

const completedTasks =
    document.getElementById("completedTasks");

const progressText =
    document.getElementById("progressText");

const progressFill =
    document.getElementById("progressFill");

const themeButton =
    document.getElementById("themeButton");


// Edit modal

const editModal =
    document.getElementById("editModal");

const editTitle =
    document.getElementById("editTitle");

const editPriority =
    document.getElementById("editPriority");

const editDate =
    document.getElementById("editDate");

const closeModal =
    document.getElementById("closeModal");

const cancelEdit =
    document.getElementById("cancelEdit");

const saveEdit =
    document.getElementById("saveEdit");

let editingTaskId = null;


// State

let tasks = [];

let currentFilter = "all";

let searchQuery = "";


// API

async function loadTasks() {

    try {

        const response =
            await fetch("/api/tasks");

        if (!response.ok) {
            throw new Error(
                "Не вдалося завантажити завдання"
            );
        }

        tasks = await response.json();

        // Додаємо значення за замовчуванням
        tasks = tasks.map(task => ({
            ...task,
            priority: task.priority || "medium",
            dueDate: task.dueDate || ""
        }));

        saveToLocalStorage();

        renderTasks();

    } catch (error) {

        console.error(error);

        loadFromLocalStorage();
    }
}


// Add

async function addTask(
    title,
    priority,
    dueDate
) {

    try {

        const response = await fetch(
            "/api/tasks",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title,
                    priority,
                    dueDate
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                "Помилка додавання"
            );
        }

        const task = await response.json();

        tasks.push(task);

        saveToLocalStorage();

        renderTasks();

    } catch (error) {

        console.error(error);

        // Fallback
        const task = {
            id: Date.now().toString(),
            title,
            completed: false,
            priority,
            dueDate,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);

        saveToLocalStorage();

        renderTasks();
    }
}


// Toggle

async function toggleTask(id) {

    try {

        const response = await fetch(
            `/api/tasks/${id}`,
            {
                method: "PATCH"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Помилка зміни статусу"
            );
        }

        const updatedTask =
            await response.json();

        tasks = tasks.map(task =>
            task.id === id
                ? updatedTask
                : task
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


// Delete

async function deleteTask(id) {

    try {

        const response = await fetch(
            `/api/tasks/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Помилка видалення"
            );
        }

        tasks = tasks.filter(
            task => task.id !== id
        );

        saveToLocalStorage();

        renderTasks();

    } catch (error) {

        console.error(error);

        tasks = tasks.filter(
            task => task.id !== id
        );

        saveToLocalStorage();

        renderTasks();
    }
}


// Edit

function openEditModal(task) {

    editingTaskId = task.id;

    editTitle.value = task.title;

    editPriority.value =
        task.priority || "medium";

    editDate.value =
        task.dueDate || "";

    editModal.classList.remove("hidden");

    editTitle.focus();
}


function closeEditModal() {

    editingTaskId = null;

    editModal.classList.add("hidden");
}


async function saveEditedTask() {

    if (!editingTaskId) {
        return;
    }

    const title =
        editTitle.value.trim();

    if (!title) {

        alert(
            "Назва завдання не може бути порожньою"
        );

        return;
    }

    const data = {
        title,
        priority: editPriority.value,
        dueDate: editDate.value
    };

    try {

        const response = await fetch(
            `/api/tasks/${editingTaskId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );

        if (!response.ok) {
            throw new Error(
                "Помилка редагування"
            );
        }

        const updatedTask =
            await response.json();

        tasks = tasks.map(task =>
            task.id === editingTaskId
                ? updatedTask
                : task
        );

        saveToLocalStorage();

        closeEditModal();

        renderTasks();

    } catch (error) {

        console.error(error);

        tasks = tasks.map(task => {

            if (task.id === editingTaskId) {

                return {
                    ...task,
                    ...data
                };
            }

            return task;
        });

        saveToLocalStorage();

        closeEditModal();

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

    const saved =
        localStorage.getItem("todoTasks");

    if (saved) {

        try {

            tasks = JSON.parse(saved);

        } catch {

            tasks = [];
        }

    } else {

        tasks = [];
    }

    renderTasks();
}


// Filtering

function getFilteredTasks() {

    let result = [...tasks];


    // Filter
    if (currentFilter === "active") {

        result = result.filter(
            task => !task.completed
        );

    } else if (currentFilter === "completed") {

        result = result.filter(
            task => task.completed
        );
    }


    // Search
    if (searchQuery) {

        result = result.filter(task =>
            task.title
                .toLowerCase()
                .includes(
                    searchQuery.toLowerCase()
                )
        );
    }


    return result;
}


// Render

function renderTasks() {

    taskList.innerHTML = "";

    const filteredTasks =
        getFilteredTasks();


    if (filteredTasks.length === 0) {

        const empty =
            document.createElement("li");

        empty.className = "empty";

        if (searchQuery) {

            empty.textContent =
                "За вашим запитом нічого не знайдено 🔍";

        } else {

            empty.textContent =
                "Завдань поки немає 📝";
        }

        taskList.appendChild(empty);

    } else {

        filteredTasks.forEach(
            task => {

                const li =
                    document.createElement("li");

                li.className = "task";

                if (task.completed) {
                    li.classList.add("completed");
                }


                // Checkbox
                const checkbox =
                    document.createElement("input");

                checkbox.type = "checkbox";

                checkbox.className =
                    "task-checkbox";

                checkbox.checked =
                    task.completed;

                checkbox.addEventListener(
                    "change",
                    () => toggleTask(task.id)
                );


                // Info
                const info =
                    document.createElement("div");

                info.className =
                    "task-info";


                // Title
                const title =
                    document.createElement("span");

                title.className =
                    "task-title";

                title.textContent =
                    task.title;


                // Meta
                const meta =
                    document.createElement("div");

                meta.className =
                    "task-meta";


                // Priority
                const priority =
                    document.createElement("span");

                priority.className =
                    `priority priority-${task.priority}`;

                if (task.priority === "high") {

                    priority.textContent =
                        "🔴 Високий";

                } else if (
                    task.priority === "low"
                ) {

                    priority.textContent =
                        "🟢 Низький";

                } else {

                    priority.textContent =
                        "🟡 Середній";
                }


                meta.appendChild(priority);


                // Date
                if (task.dueDate) {

                    const date =
                        document.createElement("span");

                    date.textContent =
                        `📅 ${formatDate(
                            task.dueDate
                        )}`;

                    meta.appendChild(date);


                    // Overdue
                    if (
                        !task.completed &&
                        isOverdue(task.dueDate)
                    ) {

                        const overdue =
                            document.createElement("span");

                        overdue.textContent =
                            "⚠️ Прострочено";

                        meta.appendChild(
                            overdue
                        );
                    }
                }


                info.appendChild(title);

                info.appendChild(meta);


                // Actions
                const actions =
                    document.createElement("div");

                actions.className =
                    "task-actions";


                // Edit
                const editButton =
                    document.createElement("button");

                editButton.className =
                    "edit-btn";

                editButton.textContent =
                    "✏️";

                editButton.title =
                    "Редагувати";

                editButton.addEventListener(
                    "click",
                    () => openEditModal(task)
                );


                // Delete
                const deleteButton =
                    document.createElement("button");

                deleteButton.className =
                    "delete-btn";

                deleteButton.textContent =
                    "🗑️";

                deleteButton.title =
                    "Видалити";

                deleteButton.addEventListener(
                    "click",
                    () => deleteTask(task.id)
                );


                actions.appendChild(editButton);

                actions.appendChild(deleteButton);


                li.appendChild(checkbox);

                li.appendChild(info);

                li.appendChild(actions);

                taskList.appendChild(li);
            }
        );
    }


    updateStatistics();
}


// Statistics

function updateStatistics() {

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            task => task.completed
        ).length;

    const active =
        total - completed;


    totalTasks.textContent =
        total;

    activeTasks.textContent =
        active;

    completedTasks.textContent =
        completed;


    const progress =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    progressText.textContent =
        `${progress}%`;

    progressFill.style.width =
        `${progress}%`;


    taskCounter.textContent =
        `Залишилося завдань: ${active}`;
}


// Date helpers

function formatDate(dateString) {

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        "uk-UA"
    );
}


function isOverdue(dateString) {

    const today =
        new Date();

    today.setHours(0, 0, 0, 0);

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date < today;
}


// Add event

taskForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const title =
            taskInput.value.trim();

        const priority =
            priorityInput.value;

        const dueDate =
            dateInput.value;


        if (!title) {

            alert(
                "Введіть текст завдання"
            );

            taskInput.focus();

            return;
        }


        await addTask(
            title,
            priority,
            dueDate
        );


        taskInput.value = "";

        priorityInput.value =
            "medium";

        dateInput.value = "";

        taskInput.focus();
    }
);


// Filters

filters.forEach(filter => {

    filter.addEventListener(
        "click",
        () => {

            filters.forEach(button =>
                button.classList.remove(
                    "active"
                )
            );

            filter.classList.add(
                "active"
            );

            currentFilter =
                filter.dataset.filter;

            renderTasks();
        }
    );
});


// Search

searchInput.addEventListener(
    "input",
    event => {

        searchQuery =
            event.target.value.trim();

        renderTasks();
    }
);


// Clear completed

clearCompleted.addEventListener(
    "click",
    async () => {

        const completed =
            tasks.filter(
                task => task.completed
            );

        if (completed.length === 0) {

            return;
        }

        for (const task of completed) {

            await deleteTask(task.id);
        }
    }
);


// Modal

closeModal.addEventListener(
    "click",
    closeEditModal
);

cancelEdit.addEventListener(
    "click",
    closeEditModal
);

saveEdit.addEventListener(
    "click",
    saveEditedTask
);


editModal.addEventListener(
    "click",
    event => {

        if (event.target === editModal) {

            closeEditModal();
        }
    }
);


// Theme

function loadTheme() {

    const theme =
        localStorage.getItem(
            "todoTheme"
        );

    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeButton.textContent =
            "☀️";

    } else {

        themeButton.textContent =
            "🌙";
    }
}


themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark"
        );

        const dark =
            document.body.classList.contains(
                "dark"
            );

        localStorage.setItem(
            "todoTheme",
            dark ? "dark" : "light"
        );

        themeButton.textContent =
            dark ? "☀️" : "🌙";
    }
);


// Start

loadTheme();

loadTasks();