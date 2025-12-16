import { Task } from '../../../types/task';
import { db } from './sqlite';

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    completed: row.completed === 1,
  };
}

export function addTask(task: Task): Task {
  const stmt = db.prepareSync(`
    INSERT INTO tasks (id, title, description, completed)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.executeSync([
    task.id,
    task.title,
    task.description || null,
    task.completed ? 1 : 0,
  ]);
  
  return task;
}

export function getTask(id: string): Task | null {
  const stmt = db.prepareSync(`
    SELECT * FROM tasks WHERE id = ?
  `);
  
  const result = stmt.executeSync<{ id: string; title: string; description: string | null; completed: number }>([id]);
  const row = result.getFirstSync();
  
  return row ? rowToTask(row) : null;
}


export function getAllTasks(): Task[] {
  const stmt = db.prepareSync(`
    SELECT * FROM tasks ORDER BY title
  `);
  
  const result = stmt.executeSync<{ id: string; title: string; description: string | null; completed: number }>();
  const rows = result.getAllSync();
  
  return rows.map(rowToTask);
}

export function updateTask(id: string, updates: Partial<Omit<Task, 'id'>>): Task | null {
  const task = getTask(id);
  if (!task) {
    return null;
  }
  
  const updatedTask: Task = {
    ...task,
    ...updates,
  };
  
  const stmt = db.prepareSync(`
    UPDATE tasks 
    SET title = ?, description = ?, completed = ?
    WHERE id = ?
  `);
  
  stmt.executeSync([
    updatedTask.title,
    updatedTask.description || null,
    updatedTask.completed ? 1 : 0,
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

// Seed function to pre-populate database with initial data
export function seedDatabase() {
  // Check if database is already seeded
  const existingTasks = getAllTasks();
  if (existingTasks.length > 0) {
    return; // Already seeded
  }

  // Seed tasks
  const tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Complete quarterly report',
      description: 'Finish the Q4 financial report and submit to management',
      completed: false,
    },
    {
      id: 'task-2',
      title: 'Team meeting preparation',
      description: 'Prepare agenda and slides for the weekly team meeting',
      completed: true,
    },
    {
      id: 'task-3',
      title: 'Review code pull requests',
      description: 'Review and approve pending pull requests from the team',
      completed: false,
    },
    {
      id: 'task-4',
      title: 'Update project documentation',
      description: 'Update API documentation and user guides',
      completed: false,
    },
  ];

  // Insert tasks
  tasks.forEach(task => addTask(task));
}

