import puppeteer, { Browser, Page } from "puppeteer";
import { WebSocket, WebSocketServer } from "ws";

export class PuppeteerRecorder {
  recordAction(action: string) {
    if (!this.recording) {
      console.warn("Recording is not in progress.");
      return;
    }
    console.log("Action recorded:", action);
    this.steps.push(action);
  }
  private browser: Browser | null = null;
  private page: Page | null = null;
  private recording: boolean = false;
  private steps: string[] = [];

  async startRecording(targetUrl: string, ws: WebSocket): Promise<void> {
    if (this.recording) {
      console.log("Recording is already in progress.");
      ws.send(JSON.stringify({ type: "ERROR", message: "Recording is already in progress." }));
      return;
    }

    this.browser = await puppeteer.launch({ headless: false }); // Launch browser
    this.page = await this.browser.newPage(); // Open a new page
    this.recording = true;
    this.steps = [];

    console.log(`Recording started for URL: ${targetUrl}`);
    await this.page.goto(targetUrl); // Navigate to the target URL

    // Expose a function to capture actions
    await this.page.exposeFunction("recordAction", (action: string) => {
      console.log("Action recorded:", action);
      this.steps.push(action);
      ws.send(JSON.stringify({ type: "ACTION_RECORDED", action }));
    });

    // Inject a script to capture user actions
    await this.page.evaluate(() => {
      document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const action = `Clicked on ${target.tagName}${target.id ? `#${target.id}` : ""}`;
        (window as any).recordAction(action);
      });

      document.addEventListener("input", (event) => {
        const target = event.target as HTMLElement;
        const action = `Input in ${target.tagName}${target.id ? `#${target.id}` : ""}`;
        (window as any).recordAction(action);
      });

      document.addEventListener("keydown", (event) => {
        const action = `Key pressed: ${event.key}`;
        (window as any).recordAction(action);
      });

      document.addEventListener("scroll", () => {
        const action = "Page scrolled";
        (window as any).recordAction(action);
      });
    });

    ws.send(JSON.stringify({ type: "RECORDING_STARTED" }));
  }

  async stopRecording(ws: WebSocket): Promise<void> {
    if (!this.recording) {
      console.log("No recording is in progress.");
      ws.send(JSON.stringify({ type: "ERROR", message: "No recording is in progress." }));
      return;
    }

    this.recording = false;
    console.log("Recording stopped. Steps recorded:", this.steps);

    // Send the recorded steps to the client
    ws.send(JSON.stringify({ type: "RECORDING_STOPPED", steps: this.steps }));

    // Close the browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  getRecordingStatus(): boolean {
    return this.recording;
  }
}

// Singleton instance of PuppeteerRecorder


// WebSocket integration
export function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case "START_RECORDING":
            if (data.targetUrl) {
              await recorder.startRecording(data.targetUrl, ws);
            } else {
              console.warn("Invalid START_RECORDING message:", data);
            }
            break;

          case "STOP_RECORDING":
            await recorder.stopRecording(ws);
            break;

          case "CHECK_RECORDING_STATUS":
            const isRecording = recorder.getRecordingStatus();
            ws.send(JSON.stringify({ type: "RECORDING_STATUS", isRecording }));
            break;

          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        ws.send(JSON.stringify({ type: "ERROR", message: "An error occurred while processing the message." }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
}export const recorder = new PuppeteerRecorder();