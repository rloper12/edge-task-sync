import { Hono } from "hono";
import { upgradeWebSocket, websocket } from "hono/bun";
import { logger } from "hono/logger";
import { WSContext } from "hono/ws";
import {
  addTask,
  deleteTask,
  getAllTasks,
  getTask,
  updateTask,
} from "./lib/data/server/serverTasks";
import { Task } from "./types/task";

const clients = new Set<WSContext>();

function broadcast(message: string) {
  clients.forEach((client) => {
    try {
      client.send(message);
    } catch (error) {
      console.error(`Error broadcasting to client`, error);
    }
  });
}

// Quick check for task type, would implement more robust solution in prod
function isTask(obj: any): obj is Task {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.completed === "boolean" &&
    typeof obj.createdAt === "number" &&
    typeof obj.updatedAt === "number" &&
    (obj.description === undefined || typeof obj.description === "string")
  );
}

function isTaskArray(obj: any): obj is Task[] {
  return Array.isArray(obj) && obj.every(isTask);
}

function sendError(ws: WSContext, message: string, logDetails?: any) {
  const errorMsg = JSON.stringify({
    type: "error",
    message,
  });
  if (logDetails !== undefined) {
    console.error(message, logDetails);
  } else {
    console.error(message);
  }
  ws.send(errorMsg);
}

function syncTasks(serverTasks: Task[], localTasks: Task[]) {
  const serverTaskMap = new Map<string, Task>();
  serverTasks.forEach((task) => serverTaskMap.set(task.id, task));

  const syncedResults = new Map<string, Task>();

  for (const localTask of localTasks) {
    const serverTask = serverTaskMap.get(localTask.id);

    if (!serverTask) {
      // Task exists locally but not on server, add it
      syncedResults.set(localTask.id, localTask);
      continue;
    }
    // both exist, compare timestamps to find most recent
    const localTimeStamp = localTask.updatedAt ?? localTask.createdAt ?? 0;
    const serverTimeStamp = serverTask.updatedAt ?? serverTask.createdAt ?? 0;

    const latestTask =
      localTimeStamp > serverTimeStamp ? localTask : serverTask;
    syncedResults.set(latestTask.id, latestTask);
  }

  // Add server tasks that dont exist locally
  for (const serverTask of serverTasks) {
    if (!syncedResults.has(serverTask.id)) {
      syncedResults.set(serverTask.id, serverTask);
    }
  }

  return Array.from(syncedResults.values());
}

const tasks = new Hono();

tasks.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onOpen: (event, ws) => {
        console.log("WebSocket connection established");
        clients.add(ws);
        ws.send(
          JSON.stringify({
            type: "connected",
            message: "WebSocket connection established",
          }),
        );
      },
      onMessage(event, ws) {
        console.log(`Client message, type: ${event.type}, data: ${event.data}`);

        try {
          // Parse the message data if it's a string
          let messageData: any;
          if (typeof event.data === "string") {
            try {
              messageData = JSON.parse(event.data);
            } catch (parseError) {
              sendError(ws, "Invalid JSON format in message data", parseError);
              return;
            }
          } else {
            messageData = event.data;
          }

          if (messageData.type === "sync") {
            const serverTasks = getAllTasks();
            const localTasks = messageData.data;

            if (!isTaskArray(localTasks)) {
              sendError(
                ws,
                "Invalid task array format in sync message. Expected an array of tasks.",
                localTasks,
              );
              return;
            }

            const syncResults = syncTasks(serverTasks, localTasks);
            
            // Persist sync results to server database
            for (const task of syncResults) {
              const existingTask = getTask(task.id);
              if (existingTask) {
                // Task exists, update it
                const { id, ...updates } = task;
                updateTask(id, updates);
              } else {
                // Task doesn't exist, add it
                addTask(task);
              }
            }
            // Send results to client
            broadcast(JSON.stringify({ type: "sync", data: syncResults }));
            return;
          }

          if (messageData.type === "update") {
            const data = messageData.data;

            if (!isTask(data)) {
              sendError(
                ws,
                "Invalid task format in update message. Expected a valid task object.",
                data,
              );
              return;
            }

            if (!data.id) {
              sendError(ws, "Task ID is required for update operation.");
              return;
            }

            const { id, ...updates } = data;
            const result = updateTask(id, updates);
            if (!result) {
              sendError(ws, `Task with ID ${data.id} not found for update.`);
              return;
            }

            broadcast(JSON.stringify({ type: "update", data: result }));
            return;
          }

          if (messageData.type === "add") {
            const data = messageData.data;

            if (!isTask(data)) {
              sendError(
                ws,
                "Invalid task format in add message. Expected a valid task object.",
                data,
              );
              return;
            }

            try {
              const result = addTask(data);
              broadcast(JSON.stringify({ type: "add", data: result }));
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              sendError(ws, `Failed to add task: ${errorMessage}`, error);
            }
            return;
          }

          if (messageData.type === "delete") {
            const data = messageData.data;

            if (!data || typeof data.id !== "string") {
              sendError(
                ws,
                "Invalid delete message format. Expected an object with an 'id' property.",
                data,
              );
              return;
            }

            const success = deleteTask(data.id);
            if (!success) {
              sendError(ws, `Task with ID ${data.id} not found for deletion.`);
              return;
            }

            broadcast(
              JSON.stringify({
                type: "delete",
                data: { id: data.id, success: true },
              }),
            );
            return;
          }

          // Unknown message type
          sendError(
            ws,
            `Unknown message type: ${messageData.type}. Supported types are: sync, update, add, delete.`,
            messageData.type,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          sendError(
            ws,
            `Unexpected error processing message: ${errorMessage}`,
            error,
          );
        }
      },
      onClose: (event, ws) => {
        console.log("Connection closed");
        clients.delete(ws);
      },
      onError: (event, ws) => {
        console.error("WebSocket error:", event);
      },
    };
  }),
);

tasks.get("/", (c) => {
  try {
    const tasks = getAllTasks();
    return c.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ error: "Failed to fetch tasks" }, 500);
  }
});

tasks.get("/:id", (c) => {
  const id = c.req.param("id");
  try {
    const task = getTask(id);
    return c.json(task);
  } catch (error) {
    console.error(`Error fetching task with id: ${id}`, error);
    return c.json({ error: `Faild to fetch task with id: ${id}` }, 500);
  }
});

const app = new Hono();
app.use(logger());
app.route("/api/tasks", tasks);

// Live database viewer with WebSocket
app.get("/db-view", async (c) => {
  try {
    const htmlTemplate = await Bun.file("./views/db-view.html").text();
    
    // Determine WebSocket URL based on request
    const host = c.req.header("host") || "localhost:3000";
    const protocol = c.req.header("x-forwarded-proto") || 
                     (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
    const wsProtocol = protocol === "https" ? "wss" : "ws";
    const wsUrl = `${wsProtocol}://${host}/api/tasks/ws`;
    
    // Replace placeholder with actual WebSocket URL
    const html = htmlTemplate.replace("{{WS_URL}}", wsUrl);
    
    return c.html(html);
  } catch (error) {
    console.error("Error serving db-view:", error);
    return c.text("Error loading database viewer", 500);
  }
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Set port via environment variable
if (!process.env.PORT) {
  process.env.PORT = '3000';
}

const port = Number(process.env.PORT || 3000);

const server = Bun.serve({
  port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
  websocket,
});

console.log(`Server running on http://${server.hostname}:${server.port}`);
console.log(`Database viewer: http://localhost:${server.port}/db-view`);
console.log(`WebSocket endpoint: ws://localhost:${server.port}/api/tasks/ws`);
console.log(`For devices/emulators, use your machine's IP: ws://<YOUR_IP>:${server.port}/api/tasks/ws`);
