// server/index.ts
import express2 from "express";
import http from "http";
import path2 from "path";
import { fileURLToPath } from "url";
import { WebSocketServer as WebSocketServer2 } from "ws";

// server/routes.ts
import express from "express";
import path from "path";
import { WebSocket } from "ws";

// server/recorder.ts
import puppeteer from "puppeteer";
var PuppeteerRecorder = class {
  recordAction(action) {
    throw new Error("Method not implemented.");
  }
  browser = null;
  page = null;
  recording = false;
  steps = [];
  async startRecording(targetUrl, ws) {
    if (this.recording) {
      console.log("Recording is already in progress.");
      ws.send(JSON.stringify({ type: "ERROR", message: "Recording is already in progress." }));
      return;
    }
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
    this.recording = true;
    this.steps = [];
    console.log(`Recording started for URL: ${targetUrl}`);
    await this.page.goto(targetUrl);
    await this.page.exposeFunction("recordAction", (action) => {
      console.log("Action recorded:", action);
      this.steps.push(action);
      ws.send(JSON.stringify({ type: "ACTION_RECORDED", action }));
    });
    await this.page.evaluate(() => {
      document.addEventListener("click", (event) => {
        const target = event.target;
        const action = `Clicked on ${target.tagName}${target.id ? `#${target.id}` : ""}`;
        window.recordAction(action);
      });
      document.addEventListener("input", (event) => {
        const target = event.target;
        const action = `Input in ${target.tagName}${target.id ? `#${target.id}` : ""}`;
        window.recordAction(action);
      });
      document.addEventListener("keydown", (event) => {
        const action = `Key pressed: ${event.key}`;
        window.recordAction(action);
      });
      document.addEventListener("scroll", () => {
        const action = "Page scrolled";
        window.recordAction(action);
      });
    });
    ws.send(JSON.stringify({ type: "RECORDING_STARTED" }));
  }
  async stopRecording(ws) {
    if (!this.recording) {
      console.log("No recording is in progress.");
      ws.send(JSON.stringify({ type: "ERROR", message: "No recording is in progress." }));
      return;
    }
    this.recording = false;
    console.log("Recording stopped. Steps recorded:", this.steps);
    ws.send(JSON.stringify({ type: "RECORDING_STOPPED", steps: this.steps }));
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
  getRecordingStatus() {
    return this.recording;
  }
};
var recorder = new PuppeteerRecorder();

// server/routes.ts
var recorder2 = new PuppeteerRecorder();
function setupRoutes(app2, wss) {
  wss.on("connection", (ws) => {
    ws.isAlive = true;
    console.log("Client connected");
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleWebSocketMessage(wss, ws, data);
      } catch (error) {
        console.error("Error handling message:", error);
        ws.send(JSON.stringify({ type: "ERROR", message: "Invalid message format" }));
      }
    });
    ws.send(
      JSON.stringify({
        type: "INIT",
        isRecording: recorder2.getRecordingStatus()
      })
    );
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app2.post("/api/record/start", async (req, res) => {
    const targetUrl = req.body.targetUrl;
    if (!targetUrl) {
      return res.status(400).json({ error: "Target URL is required" });
    }
    const activeClient = Array.from(wss.clients).find(
      (client) => client.readyState === WebSocket.OPEN
    );
    if (!activeClient) {
      return res.status(500).json({ error: "No active WebSocket connection available" });
    }
    try {
      await recorder2.startRecording(targetUrl, activeClient);
      broadcastToAll(wss, { type: "RECORDING_STARTED" });
      res.json({ status: "recording" });
    } catch (error) {
      console.error("Error starting recording:", error);
      res.status(500).json({ error: "Failed to start recording" });
    }
  });
  app2.post("/api/record/stop", async (req, res) => {
    const activeClient = Array.from(wss.clients).find(
      (client) => client.readyState === WebSocket.OPEN
    );
    if (!activeClient) {
      return res.status(500).json({ error: "No active WebSocket connection available" });
    }
    try {
      const steps = await recorder2.stopRecording(activeClient);
      broadcastToAll(wss, { type: "RECORDING_STOPPED", steps });
      res.json({ steps });
    } catch (error) {
      console.error("Error stopping recording:", error);
      res.status(500).json({ error: "Failed to stop recording" });
    }
  });
  app2.use(express.static(path.join(process.cwd(), "client/dist")));
  app2.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "client/dist/index.html"));
  });
}
async function handleWebSocketMessage(wss, ws, message) {
  switch (message.type) {
    case "RECORD_ACTION":
      try {
        recorder2.recordAction(message.action);
        broadcastToAll(wss, {
          type: "ACTION_RECORDED",
          action: message.action
        });
      } catch (error) {
        console.error("Error recording action:", error);
        ws.send(JSON.stringify({ type: "ERROR", message: "Failed to record action" }));
      }
      break;
    case "CHECK_RECORDING_STATUS":
      const isRecording = recorder2.getRecordingStatus();
      ws.send(JSON.stringify({ type: "RECORDING_STATUS", isRecording }));
      break;
    default:
      console.warn("Unknown message type:", message.type);
      ws.send(JSON.stringify({ type: "ERROR", message: "Unknown message type" }));
  }
}
function broadcastToAll(wss, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// server/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
var httpServer = http.createServer(app);
var log = console.log;
var serveStatic = (app2) => {
};
var setupVite = async (app2, server) => {
};
(async () => {
  const wss = new WebSocketServer2({ server: httpServer });
  setupRoutes(app, wss);
  const clientBuildPath = path2.join(__dirname, "../client/dist");
  app.use(express2.static(clientBuildPath));
  app.get("*", (_req, res) => {
    res.sendFile(path2.join(clientBuildPath, "index.html"));
  });
  app.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path3.startsWith("/api")) {
        let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\u2026";
        }
        log(logLine);
      }
    });
    next();
  });
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }
  const PORT = 5501;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
