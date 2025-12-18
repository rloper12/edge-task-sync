import { Task } from "@/types/task";
import * as localTasks from "./local/tasks";

let wsSendMessage: ((message: any) => Promise<void>) | null = null;
let isWsConnected = false;

// TODO: Find a better pattern than settting this in-memory, global state
export function setWebSocketConnection(
  connected: boolean,
  sendMessage: ((message: any) => Promise<void>) | null,
) {
  isWsConnected = connected;
  wsSendMessage = sendMessage;
}

export function addTask(task: Task): Task {
  if (isWsConnected && wsSendMessage) {
    wsSendMessage({ type: "add", data: task }).catch((err) => {
      // Log silently to avoid showing error overlays for expected network issues
      console.log("Failed to send add message via WebSocket (handled):", err);
    });
    return localTasks.addTask(task);
  } else {
    return localTasks.addTask(task);
  }
}

export async function getTask(id: string) {
  return localTasks.getTask(id);
}

export async function getAllTasks() {
  return localTasks.getAllTasks();
}


export function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id">>,
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
    wsSendMessage({ type: "update", data: updatedTask }).catch((err) => {
      // Log silently to avoid showing error overlays for expected network issues
      console.log("Failed to send update message via WebSocket (handled):", err);
    });
    return localTasks.updateTask(id, updates);
  } else {
    return localTasks.updateTask(id, updates);
  }
}

export function deleteTask(id: string): boolean {
  if (isWsConnected && wsSendMessage) {
    wsSendMessage({ type: "delete", data: { id } }).catch((err) => {
      // Log silently to avoid showing error overlays for expected network issues
      console.log("Failed to send delete message via WebSocket (handled):", err);
    });
    return localTasks.deleteTask(id);
  } else {
    return localTasks.deleteTask(id);
  }
}
