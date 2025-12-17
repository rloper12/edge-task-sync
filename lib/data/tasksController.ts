import { Task } from '@/types/task';
import * as localTasks from './local/tasks';

let wsSendMessage: ((message: any) => Promise<void>) | null = null;
let isWsConnected = false;

export function setWebSocketConnection(
  connected: boolean,
  sendMessage: ((message: any) => Promise<void>) | null
) {
  isWsConnected = connected;
  wsSendMessage = sendMessage;
}

export function addTask(task: Task): Task {
  if (isWsConnected && wsSendMessage) {
    wsSendMessage({ type: 'add', data: task }).catch(err => {
      console.error('Failed to send add message via WebSocket:', err);
      // Fallback to local if WS fails
      return localTasks.addTask(task);
    });
    return localTasks.addTask(task);
  } else {
    return localTasks.addTask(task);
  }
}

export function getTask(id: string): Task | null {
  // Read from local db
  return localTasks.getTask(id);
}

export function getAllTasks(): Task[] {
  // Read from local db
  return localTasks.getAllTasks();
}

export function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id'>>,
): Task | null {
  const currentTask = localTasks.getTask(id);
  if (!currentTask) {
    return null;
  }

  const updatedTask: Task = {
    ...currentTask,
    ...updates,
    updatedAt: Date.now(),
  };

  if (isWsConnected && wsSendMessage) {
    wsSendMessage({ type: 'update', data: updatedTask }).catch(err => {
      console.error('Failed to send update message via WebSocket:', err);
      return localTasks.updateTask(id, updates);
    });
    return localTasks.updateTask(id, updates);
  } else {
    return localTasks.updateTask(id, updates);
  }
}

export function deleteTask(id: string): boolean {
  if (isWsConnected && wsSendMessage) {
    wsSendMessage({ type: 'delete', data: { id } }).catch(err => {
      console.error('Failed to send delete message via WebSocket:', err);
      return localTasks.deleteTask(id);
    });
    return localTasks.deleteTask(id);
  } else {
    return localTasks.deleteTask(id);
  }
}
