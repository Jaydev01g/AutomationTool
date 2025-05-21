import express, { Express } from "express";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";
import { PuppeteerRecorder } from "./recorder";
// Removed conflicting import of 'recorder'

const recorder = new PuppeteerRecorder();

interface CustomWebSocket extends WebSocket {
  isAlive?: boolean;
}

export function setupRoutes(app: Express, wss: WebSocketServer) {
  // WebSocket connection handling
  wss.on("connection", (ws: CustomWebSocket) => {
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

    // Send initial state
    ws.send(
      JSON.stringify({
        type: "INIT",
        isRecording: recorder.getRecordingStatus(),
      })
    );
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API routes
  app.post("/api/record/start", async (req, res) => {
    const targetUrl = req.body.targetUrl; // Assuming the target URL is sent in the request body
    if (!targetUrl) {
      return res.status(400).json({ error: "Target URL is required" });
    }

    // Find an active WebSocket client to pass to the recorder
    const activeClient = Array.from(wss.clients).find(
      (client) => client.readyState === WebSocket.OPEN
    ) as CustomWebSocket;

    if (!activeClient) {
      return res.status(500).json({ error: "No active WebSocket connection available" });
    }

    try {
      await recorder.startRecording(targetUrl, activeClient);
      broadcastToAll(wss, { type: "RECORDING_STARTED" });
      res.json({ status: "recording" });
    } catch (error) {
      console.error("Error starting recording:", error);
      res.status(500).json({ error: "Failed to start recording" });
    }
  });

  app.post("/api/record/stop", async (req, res) => {
    const activeClient = Array.from(wss.clients).find(
      (client) => client.readyState === WebSocket.OPEN
    ) as CustomWebSocket;

    if (!activeClient) {
      return res.status(500).json({ error: "No active WebSocket connection available" });
    }

    try {
      const steps = await recorder.stopRecording(activeClient);
      broadcastToAll(wss, { type: "RECORDING_STOPPED", steps });
      res.json({ steps });
    } catch (error) {
      console.error("Error stopping recording:", error);
      res.status(500).json({ error: "Failed to stop recording" });
    }
  });

  // Serve static files
  app.use(express.static(path.join(process.cwd(), "client/dist")));

  // SPA fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "client/dist/index.html"));
  });
}

async function handleWebSocketMessage(
  wss: WebSocketServer,
  ws: CustomWebSocket,
  message: any
) {
  switch (message.type) {
    case "RECORD_ACTION":
      try {
        recorder.recordAction(message.action);
        broadcastToAll(wss, {
          type: "ACTION_RECORDED",
          action: message.action,
        });
      } catch (error) {
        console.error("Error recording action:", error);
        ws.send(JSON.stringify({ type: "ERROR", message: "Failed to record action" }));
      }
      break;

    case "CHECK_RECORDING_STATUS":
      const isRecording = recorder.getRecordingStatus();
      ws.send(JSON.stringify({ type: "RECORDING_STATUS", isRecording }));
      break;

    default:
      console.warn("Unknown message type:", message.type);
      ws.send(JSON.stringify({ type: "ERROR", message: "Unknown message type" }));
  }
}

function broadcastToAll(wss: WebSocketServer, message: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}