const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const tasksFile = path.join(__dirname, "tasks.json");

// Middleware
app.use(express.json());

// Дозволяємо серверу віддавати frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Читання завдань із файлу
function readTasks() {
    try {
        const data = fs.readFileSync(tasksFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Запис завдань у файл
function writeTasks(tasks) {
    fs.writeFileSync(
        tasksFile,
        JSON.stringify(tasks, null, 2),
        "utf8"
    );
}

// GET /api/tasks
// Отримати всі завдання
app.get("/api/tasks", (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

// POST /api/tasks
// Додати нове завдання
app.post("/api/tasks", (req, res) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            message: "Назва завдання не може бути порожньою"
        });
    }

    const tasks = readTasks();

    const newTask = {
        id: Date.now().toString(),
        title: title.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    writeTasks(tasks);

    res.status(201).json(newTask);
});

// PATCH /api/tasks/:id
// Змінити статус завдання
app.patch("/api/tasks/:id", (req, res) => {
    const tasks = readTasks();

    const task = tasks.find(
        task => task.id === req.params.id
    );

    if (!task) {
        return res.status(404).json({
            message: "Завдання не знайдено"
        });
    }

    task.completed = !task.completed;

    writeTasks(tasks);

    res.json(task);
});

// DELETE /api/tasks/:id
// Видалити завдання
app.delete("/api/tasks/:id", (req, res) => {
    const tasks = readTasks();

    const taskExists = tasks.some(
        task => task.id === req.params.id
    );

    if (!taskExists) {
        return res.status(404).json({
            message: "Завдання не знайдено"
        });
    }

    const updatedTasks = tasks.filter(
        task => task.id !== req.params.id
    );

    writeTasks(updatedTasks);

    res.json({
        message: "Завдання успішно видалено"
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
});