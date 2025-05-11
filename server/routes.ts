import type { Express, Request, Response } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";

// Stubs for missing modules
const insertTestSchema = {
  parse: (data: any) => data,
};
const recorder = {
  recordedSteps: [] as any[],
  isRecording: false,
  playTest: async (test: any) => {},
};
const storage = {
  getAllTests: async () => [],
  getTest: async (id: number) => null,
  createTest: async (data: any) => data,
  updateTest: async (id: number, data: any) => data,
  deleteTest: async (id: number) => {},
  createTestExecution: async (data: any) => data,
  //updateTest: async (id: number, data: any) => data,
};

interface CustomWebSocket extends WebSocket {
  isAlive?: boolean;
}

export async function registerRoutes(app: Express, httpServer: any): Promise<void> {
  app.get("/api/tests", async (req: Request, res: Response) => {
    try {
      const tests = await storage.getAllTests();
      res.json(tests);
    } catch (error) {
      handleApiError(res, error, "Failed to fetch tests");
    }
  });

  app.get("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const test = await storage.getTest(id);

      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.json(test);
    } catch (error) {
      handleApiError(res, error, "Failed to fetch test");
    }
  });
  
  const testSchema = z.object({
    name: z.string(),
    targetUrl: z.string().url(),
    browser: z.string(),
    steps: z.array(z.object({
      action: z.string(),
      selector: z.string().optional(),
      value: z.string().optional(),
    })),
  });
  
  app.post("/api/tests", async (req: Request, res: Response) => {
    try {
      const data = testSchema.parse(req.body); // Validate request body
      const test = await storage.createTest(data);
      res.status(201).json(test);
    } catch (error) {
      handleValidationError(res, error, "Failed to create test");
    }
  });

  app.put("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertTestSchema.parse(req.body);
      const test = await storage.updateTest(id, data);

      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.json(test);
    } catch (error) {
      handleValidationError(res, error, "Failed to update test");
    }
  });

  app.delete("/api/tests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTest(id);
      res.status(204).send();
    } catch (error) {
      handleApiError(res, error, "Failed to delete test");
    }
  });

  app.post("/api/test-executions/run/:testId", async (req: Request, res: Response) => {
    try {
      const testId = parseInt(req.params.testId);
      const test = await storage.getTest(testId);

      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      const execution = await runTestExecution(testId, test);
      res.status(200).json(execution);
    } catch (error) {
      handleApiError(res, error, "Failed to run test");
    }
  });

  const MAX_CLIENTS = 100;
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    clientTracking: true,
  });

  console.log("WebSocket server initialized on path: /ws");

  wss.on("connection", (ws: CustomWebSocket) => {
    if (wss.clients && wss.clients.size > MAX_CLIENTS) {
      console.warn("Too many clients connected. Closing connection.");
      ws.close(1001, "Server overloaded");
      return;
    }

    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (message) => handleWebSocketMessage(wss, ws, message));
    ws.on("close", (code, reason) =>
      console.log(`WebSocket client disconnected: Code: ${code}, Reason: ${reason}`)
    );
    ws.on("error", (error) => console.error("WebSocket error:", error));

    sendInitialState(ws);
  });

  // Improved heartbeat mechanism
  const interval = setInterval(() => {
    if (!wss.clients) return;
    wss.clients.forEach((ws: CustomWebSocket) => {
      if (!ws.isAlive) {
        console.log("Terminating dead WebSocket connection");
        ws.terminate();
        return;
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 10000); // Ping every 10 seconds for quicker detection

  wss.on("close", () => {
    clearInterval(interval);
  });
}

function handleWebSocketMessage(wss: WebSocketServer, ws: WebSocket, message: any) {
  try {
    const data = JSON.parse(message.toString());

    if (!data.type) {
      console.warn("Invalid WebSocket message received:", data);
      return;
    }

    switch (data.type) {
      case "RECORD_ACTION":
        if (data.action) {
          recorder.recordedSteps.push(data.action);
          broadcastMessage(wss, {
            type: "ACTION_RECORDED",
            action: data.action,
          });
        } else {
          console.warn("Invalid RECORD_ACTION message:", data);
        }
        break;

      case "PING":
        ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
        break;

      case "RECORDING_STATUS":
        if (data.isRecording !== undefined) {
          broadcastMessage(wss, {
            type: "RECORDING_STATUS_CHANGED",
            isRecording: data.isRecording,
            testName: data.testName,
            targetUrl: data.targetUrl,
            browser: data.browser,
          });
        } else {
          console.warn("Invalid RECORDING_STATUS message:", data);
        }
        break;

      default:
        console.warn("Unknown WebSocket message type:", data.type);
    }
  } catch (error) {
    console.error("Error handling WebSocket message:", error);
  }
}

function broadcastMessage(wss: WebSocketServer, message: any) {
  if (!wss.clients) return;
  console.log("Broadcasting message:", message); // Add this line
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function sendInitialState(ws: WebSocket) {
  try {
    const initialMessage = JSON.stringify({
      type: "INIT",
      isRecording: recorder.isRecording,
      steps: recorder.recordedSteps,
    });
    ws.send(initialMessage);
    console.log("Sent initial state to client:", initialMessage);
  } catch (error) {
    console.error("Error sending initial state to client:", error);
  }
}

async function runTestExecution(testId: number, test: any) {
  try {
    await recorder.playTest(test);
    const executionData = {
      testId,
      testName: test.name,
      browser: test.browser,
      status: "passed",
      duration: "2m 15s",
      logs: [],
      screenshots: [],
    };

    const execution = await storage.createTestExecution(executionData);
    await storage.updateTest(testId, {
      ...test,
      lastStatus: "passed",
      lastRun: new Date().toISOString(),
    });

    return execution;
  } catch (error) {
    const executionData = {
      testId,
      testName: test.name,
      browser: test.browser,
      status: "failed",
      duration: "0m 45s",
      logs: [{ error: error instanceof Error ? error.message : "Unknown error" }],
      screenshots: [],
    };

    const execution = await storage.createTestExecution(executionData);
    await storage.updateTest(testId, {
      ...test,
      lastStatus: "failed",
      lastRun: new Date().toISOString(),
    });

    return execution;
  }
}

function handleApiError(res: Response, error: any, message: string) {
  console.error(message, error.stack || error); // Log stack trace
  const responseMessage = process.env.NODE_ENV === "development" ? error.message : message;
  res.status(500).json({ message: responseMessage });
}

function handleValidationError(res: Response, error: any, message: string) {
  if (error instanceof Error) {
    res.status(400).json({ message: error.message });
  } else {
    handleApiError(res, error, message);
  }
}
