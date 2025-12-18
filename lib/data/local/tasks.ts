import { Task } from "../../../types/task";
import { db } from "./sqlite";

function rowToTask(row: any): Task {
  const now = Date.now();
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    completed: row.completed === 1,
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? now,
  };
}

export function addTask(task: Task): Task {
  const now = Date.now();
  const tasks: Task = {
    ...task,
    createdAt: task.createdAt ?? now,
    updatedAt: task.updatedAt ?? now,
  };

  const stmt = db.prepareSync(`
    INSERT INTO tasks (id, title, description, completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.executeSync([
    tasks.id,
    tasks.title,
    tasks.description || null,
    tasks.completed ? 1 : 0,
    tasks.createdAt,
    tasks.updatedAt,
  ]);

  return tasks;
}

export function getTask(id: string): Task | null {
  const stmt = db.prepareSync(`
    SELECT * FROM tasks WHERE id = ?
  `);

  const result = stmt.executeSync<{
    id: string;
    title: string;
    description: string | null;
    completed: number;
    created_at: number;
    updated_at: number;
  }>([id]);
  const row = result.getFirstSync();

  return row ? rowToTask(row) : null;
}

export function getAllTasks(): Task[] {
  const stmt = db.prepareSync(`
    SELECT * FROM tasks ORDER BY title
  `);

  const result = stmt.executeSync<{
    id: string;
    title: string;
    description: string | null;
    completed: number;
    created_at: number;
    updated_at: number;
  }>();
  const rows = result.getAllSync();

  return rows.map(rowToTask);
}

export function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id">>,
): Task | null {
  const task = getTask(id);
  if (!task) {
    return null;
  }

  const updatedTask: Task = {
    ...task,
    ...updates,
    updatedAt: Date.now(),
  };

  const stmt = db.prepareSync(`
    UPDATE tasks
    SET title = ?, description = ?, completed = ?, updated_at = ?
    WHERE id = ?
  `);

  stmt.executeSync([
    updatedTask.title,
    updatedTask.description || null,
    updatedTask.completed ? 1 : 0,
    updatedTask.updatedAt,
    id,
  ]);

  return updatedTask;
}

export function deleteTask(id: string): boolean {
  const stmt = db.prepareSync(`
    DELETE FROM tasks WHERE id = ?
  `);

  const result = stmt.executeSync([id]);
  return result.changes > 0;
}
