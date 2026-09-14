const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const tasksFile = path.join(__dirname, "tasks.json");

// Middleware
app.use(express.json());

// Frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Робота з JSON-файлом
function readTasks() {
    try {
        const data = fs.readFileSync(tasksFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeTasks(tasks) {
    fs.writeFileSync(
        tasksFile,
        JSON.stringify(tasks, null, 2),
        "utf8"
    );
}

// GET — отримати всі завдання
app.get("/api/tasks", (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

// POST — створити завдання
app.post("/api/tasks", (req, res) => {
    const {
        title,
        priority = "medium",
        dueDate = ""
    } = req.body;

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
        priority,
        dueDate,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);

    writeTasks(tasks);

    res.status(201).json(newTask);
});

// PUT — редагувати завдання
app.put("/api/tasks/:id", (req, res) => {
    const tasks = readTasks();

    const task = tasks.find(
        task => task.id === req.params.id
    );

    if (!task) {
        return res.status(404).json({
            message: "Завдання не знайдено"
        });
    }

    const {
        title,
        priority,
        dueDate
    } = req.body;

    if (title !== undefined) {
        if (!title.trim()) {
            return res.status(400).json({
                message: "Назва завдання не може бути порожньою"
            });
        }

        task.title = title.trim();
    }

    if (priority !== undefined) {
        task.priority = priority;
    }

    if (dueDate !== undefined) {
        task.dueDate = dueDate;
    }

    writeTasks(tasks);

    res.json(task);
});

// PATCH — змінити статус
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

// DELETE — видалити завдання
app.delete("/api/tasks/:id", (req, res) => {
    const tasks = readTasks();

    const exists = tasks.some(
        task => task.id === req.params.id
    );

    if (!exists) {
        return res.status(404).json({
            message: "Завдання не знайдено"
        });
    }

    const updatedTasks = tasks.filter(
        task => task.id !== req.params.id
    );

    writeTasks(updatedTasks);

    res.json({
        message: "Завдання видалено"
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
});