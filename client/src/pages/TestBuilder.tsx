import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";

export default function TestBuilder() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<string[]>([]);
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const newWindowRef = useRef<Window | null>(null);
  const { toast } = useToast();

  // Establish WebSocket connection
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:5501");

    socket.onopen = () => {
      console.log("WebSocket connected");
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Message from server:", data);

      switch (data.type) {
        case "INIT":
          console.log("WebSocket initialized:", data);
          setIsRecording(data.isRecording || false);
          break;
        case "RECORDING_STARTED":
          setIsRecording(true);
          toast({ title: "Recording Started", description: "Recording has started." });
          break;
        case "RECORDING_STOPPED":
          setIsRecording(false);
          setRecordedSteps(data.steps || []);
          toast({ title: "Recording Stopped", description: "Recording has stopped." });
          break;
        case "ACTION_RECORDED":
          setRecordedSteps((prev) => [...prev, data.action]);
          toast({ title: "Action Recorded", description: data.action });
          break;
        default:
          console.warn("Unknown message type:", data.type);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  // Listen for messages from the new window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return; // Ensure the message is from the same origin

      const { type, action } = event.data;
      if (type === "ACTION_RECORDED") {
        setRecordedSteps((prev) => [...prev, action]);
        toast({ title: "Action Recorded", description: action });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleLaunch = () => {
    if (!/^https?:\/\//.test(targetUrl)) {
      toast({ title: "Invalid URL", description: "Please provide a valid URL.", variant: "destructive" });
      return;
    }

    // Open the target URL in a new window
    newWindowRef.current = window.open(
      targetUrl,
      "_blank",
      "width=1200,height=800,scrollbars=yes,resizable=yes"
    );

    if (newWindowRef.current) {
      // Inject a script into the new window to start recording actions
      newWindowRef.current.onload = () => {
        try {
          if (newWindowRef.current && newWindowRef.current.document) {
            const scriptContent = `
              (function() {
                const recordAction = (action) => {
                  window.opener.postMessage({ type: "ACTION_RECORDED", action }, window.location.origin);
                };

                // Add a recording indicator
                const recordingIndicator = document.createElement('div');
                recordingIndicator.style.position = 'fixed';
                recordingIndicator.style.top = '10px';
                recordingIndicator.style.right = '10px';
                recordingIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
                recordingIndicator.style.color = 'white';
                recordingIndicator.style.padding = '5px 10px';
                recordingIndicator.style.borderRadius = '5px';
                recordingIndicator.style.zIndex = '9999';
                recordingIndicator.innerText = '● Recording';
                document.body.appendChild(recordingIndicator);

                // Capture user actions
                document.addEventListener('click', (event) => {
                  const target = event.target;
                  const action = \`Clicked on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`;
                  recordAction(action);
                });

                document.addEventListener('input', (event) => {
                  const target = event.target;
                  const action = \`Input in \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`;
                  recordAction(action);
                });

                document.addEventListener('keydown', (event) => {
                  const action = \`Key pressed: \${event.key}\`;
                  recordAction(action);
                });

                document.addEventListener('mousemove', (event) => {
                  const action = \`Mouse moved to: \${event.clientX}, \${event.clientY}\`;
                  recordAction(action);
                });

                document.addEventListener('contextmenu', (event) => {
                  const target = event.target;
                  const action = \`Right-clicked on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`;
                  recordAction(action);
                });

                document.addEventListener('dblclick', (event) => {
                  const target = event.target;
                  const action = \`Double-clicked on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`;
                  recordAction(action);
                });

                document.addEventListener('dragstart', (event) => {
                  const target = event.target;
                  const action = \`Drag started on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`;
                  recordAction(action);
                });

                document.addEventListener('drop', (event) => {
                  const target = event.target;
                  const action = \`Dropped on \${target.tagName}\${target.id ? \`#\${target.id}\` : ""}\`;
                  recordAction(action);
                });
              })();
            `;
            const script = newWindowRef.current.document.createElement("script");
            script.textContent = scriptContent;
            newWindowRef.current.document.body.appendChild(script);

            if (ws) {
              ws.send(JSON.stringify({ type: "START_RECORDING", targetUrl }));
            }

            toast({ title: "New Window Opened", description: "Recording has started in the new window." });
          }
        } catch (error) {
          console.error("Error injecting script into new window:", error);
          toast({ title: "Error", description: "Failed to inject script into the new window.", variant: "destructive" });
        }
      };
    } else {
      toast({ title: "Failed to Open Window", description: "Please check your browser settings.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: "STOP_RECORDING" }));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Test Builder</h1>
      <div className="mb-4">
        <label>Target URL:</label>
        <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
      </div>
      <div className="mb-4">
        <Button onClick={handleLaunch}>Launch in New Window</Button>
        <Button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </Button>
      </div>
      <div>
        <h2>Recorded Steps:</h2>
        <ul>
          {recordedSteps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}