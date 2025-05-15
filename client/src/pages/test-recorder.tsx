import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/hooks/use-websocket";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function TestRecorder() {
  const [testName, setTestName] = useState("");
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const [browser, setBrowser] = useState("Chrome");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const newWindowRef = useRef<Window | null>(null);
  const [searchParams] = useSearchParams();
  const mode =searchParams.get("mode");
  const isDragDropMode = mode === "drag-drop";
  const isRecordPlayMode = mode === "record-play";
  // WebSocket setup
  const { connected, sendMessage } = useWebSocket({
    onMessage: (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ACTION_RECORDED" && data.action) {
          setRecordedSteps((prev) => [...prev, data.action]);
          showToast(`Recorded: ${data.action}`);
        } else if (data.type === "INIT") {
          setIsRecording(data.isRecording);
          if (data.steps?.length) setRecordedSteps(data.steps);
        } else if (data.type === "RECORDING_STARTED") {
          setIsRecording(true);
          showToast("Recording started.");
        } else if (data.type === "RECORDING_STOPPED") {
          setIsRecording(false);
          setRecordedSteps(data.steps || []);
          showToast("Recording stopped.");
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    },
    onOpen: () => console.log("WebSocket connected"),
    onClose: () => console.log("WebSocket disconnected"),
    onError: (error: any) => {
      console.error("WebSocket error:", error);
      showToast("WebSocket error. Some features may not work.");
    },
  });

  const showToast = (message: string) => setToast(message);

  const handleStartRecording = async () => {
    if (!testName.trim()) {
      showToast("Please enter a test name.");
      return;
    }
    if (!/^https?:\/\//.test(targetUrl)) {
      showToast("Please enter a valid URL (http or https).");
      return;
    }

    try {
      const response = await fetch("/api/recorder/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testName, targetUrl, browser }),
      });

      if (!response.ok) throw new Error("Failed to start recording");

      sendMessage({ type: "START_RECORDING", targetUrl });
      showToast("Recording started. Interact with the browser.");
    } catch {
      showToast("Failed to start recording");
    }
  };

  const handleStopRecording = async () => {
    try {
      const response = await fetch("/api/recorder/stop", { method: "POST" });
      if (!response.ok) throw new Error("Failed to stop recording");

      sendMessage({ type: "STOP_RECORDING" });
      setIsRecording(false);
      showToast("Recording stopped. Test steps captured.");
    } catch (error) {
      console.error("Error stopping recording:", error);
      showToast("Failed to stop recording");
    }
  };

  const handlePlayRecording = async () => {
    if (!recordedSteps.length) {
      showToast("No steps to play. Record some steps first.");
      return;
    }
    try {
      setIsPlaying(true);
      const response = await fetch("/api/recorder/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testName, browser, steps: recordedSteps }),
      });

      if (!response.ok) throw new Error("Failed to play recording");

      showToast("Test execution complete.");
    } catch {
      showToast("Failed to play recording");
    } finally {
      setIsPlaying(false);
    }
  };

  const handleLaunchNewWindow = () => {
    debugger;
    if (!/^https?:\/\//.test(targetUrl)) {
      showToast("Please provide a valid URL.");
      debugger;
      return;
    }

    newWindowRef.current = window.open(
      targetUrl,
      "_blank",
      "width=1200,height=800,scrollbars=yes,resizable=yes"
    );
    debugger;
    if (newWindowRef.current) {
      newWindowRef.current.onload = () => {
        debugger;
        try {
          if (newWindowRef.current && newWindowRef.current.document) {
            debugger;
            const scriptContent = `
              (function() {
                const recordAction = (action) => {
                  window.opener.postMessage({ type: "ACTION_RECORDED", action }, window.location.origin);
                };

                document.addEventListener('click', (event) => {
                  const target = event.target;
                  const action = {
                    description: \`Clicked on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`,
                    step: {
                      type: "click",
                      selector: target.id ? \`#\${target.id}\` : "",
                    },
                  };
                  recordAction(action.description);
                });
                document.addEventListener('input', (event) => {
                  const target = event.target;
                  const action = {
                    description: \`Input in \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`,
                    step: {
                      type: "input",
                      selector: target.id ? \`#\${target.id}\` : "",
                    },
                  };
                  recordAction(action.description);
                }
                document.addEventListener('keydown', (event) => {
                  const action = {
                    description: \`Key pressed: \${event.key}\`,
                    step: {
                      type: "keydown",
                      key: event.key,
                    },
                  };
                  recordAction(action.description);
                });
                document.addEventListener('scroll', () => {
                  const action = {
                    description: "Page scrolled",
                    step: {
                      type: "scroll",
                    },
                  };
                  recordAction(action.description);
                });
                document.addEventListener('mousemove', (event) => {
                  const action = {
                    description: \`Mouse moved to: \${event.clientX}, \${event.clientY}\`,
                    step: {
                      type: "mousemove",
                      x: event.clientX,
                      y: event.clientY,
                    },
                  };
                  recordAction(action.description);
                });
                document.addEventListener('contextmenu', (event) => {
                  const target = event.target;
                  const action = {
                    description: \`Right-clicked on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`,
                    step: {
                      type: "contextmenu",
                      selector: target.id ? \`#\${target.id}\` : "",
                    },
                  };
                  recordAction(action.description);
                });
                document.addEventListener('dblclick', (event) => {
                  const target = event.target;
                  const action = {
                    description: \`Double-clicked on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`,
                    step: {
                      type: "dblclick",
                      selector: target.id ? \`#\${target.id}\` : "",
                    },
                  };
                  recordAction(action.description);
                });

                document.addEventListener('dragstart', (event) => {
                  const target = event.target;
                  const action = {
                    description: \`Drag started on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`,
                    step: {
                      type: "dragstart",
                      selector: target.id ? \`#\${target.id}\` : "",
                    },
                  };
                  recordAction(action.description);
                }
                document.addEventListener('drop', (event) => {
                  const target = event.target;
                  const action = {
                    description: \`Dropped on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`,
                    step: {
                      type: "drop",
                      selector: target.id ? \`#\${target.id}\` : "",
                    },
                  };
                  recordAction(action.description);
                });
                document.addEventListener('resize', () => {
                  const action = {
                    description: "Window resized",
                    step: {
                      type: "resize",
                    },
                  };
                  recordAction(action.description);
                });
                document.addEventListener('beforeunload', () => {
                  const action = {
                    description: "Window closed",
                    step: {
                      type: "close",
                    },
                  };
                  recordAction(action.description);
                });
                window.addEventListener('message', (event) => {
                  if (event.origin !== window.location.origin) return;
                  if (event.data.type === "ACTION_RECORDED") {
                    const action = event.data.action;
                    const actionElement = document.createElement("div");
                    actionElement.textContent = \`Action recorded: \${action.description}\`;
                    document.body.appendChild(actionElement);
                  }
                });
              })();
            `;
            const script = newWindowRef.current.document.createElement("script");
            script.textContent = scriptContent;
            newWindowRef.current.document.body.appendChild(script);
            debugger;
          }
        } catch (error) {
          console.error("Error injecting script into new window:", error);
          showToast("Failed to inject script into the new window.");
          debugger;
        }
      };
    } else {
      showToast("Failed to open new window. Check your browser settings.");
    }
  };

  const handleDeleteStep = (index: number) => {
    setRecordedSteps((prev) => prev.filter((_, i) => i !== index));
    showToast(`Deleted step ${index + 1}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Test Recorder</h1>
        <div className={`text-sm ${connected ? "text-green-600" : "text-red-500"}`}>
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>Configure your test parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Test Name</Label>
          <Input value={testName} onChange={(e) => setTestName(e.target.value)} disabled={isRecording} />
          <Label>Target URL</Label>
          <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} disabled={isRecording} />
          <Label>Browser</Label>
          <Select value={browser} onValueChange={setBrowser} disabled={isRecording}>
            <SelectTrigger>
              <SelectValue placeholder="Select a browser" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Chrome">Chrome</SelectItem>
              <SelectItem value="Firefox">Firefox</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={isRecording ? handleStopRecording : handleStartRecording}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>
          <Button onClick={handlePlayRecording} disabled={isPlaying || !recordedSteps.length}>
            {isPlaying ? "Playing..." : "Play Recording"}
          </Button>
          <Button onClick={handleLaunchNewWindow}>Launch in New Window</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {recordedSteps.map((step, index) => (
              <li key={index} className="flex justify-between items-center mb-2">
                <span>{index + 1}. {step}</span>
                <Button variant="destructive" onClick={() => handleDeleteStep(index)}>Delete</Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {toast && <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded shadow-lg">{toast}</div>}
    </div>
  );
}