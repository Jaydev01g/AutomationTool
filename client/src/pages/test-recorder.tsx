import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useRef, useState } from "react";

// Toast Component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded shadow-lg">
      {message}
    </div>
  );
}

// Utility to generate CSS selectors
const generateSelector = (element: HTMLElement): string => {
  if (element.id) return `#${element.id}`;
  if (element.className && typeof element.className === "string") {
    return `.${element.className.replace(/\s+/g, ".")}`;
  }
  return element.tagName.toLowerCase();
};

export default function TestRecorder() {
  const [testName, setTestName] = useState("");
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const [browser, setBrowser] = useState("Chrome");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    },
    onOpen: () => console.log("WebSocket connected"),
    onClose: () => console.log("WebSocket disconnected"),
    onError: (error: any) =>{ 
      console.error("WebSocket error:", error);
      showToast("WebSocket error. Some features may not work.");
    }
    });

  const showToast = (message: string) => setToast(message);
  const [loading, setLoading] = useState(true);
  const handleStartRecording = async () => {
    if(!testName.trim()) {
      showToast("Please enter a test name.");
      return;
    }
    if(!/^https?:\/\//.test(targetUrl)) {
      showToast("Please enter a valid URL (http or https).");
      return;
    }
    try {
      setIsRecording(true);
      setRecordedSteps([`Navigate to ${targetUrl}`]);
      setCurrentUrl(targetUrl);
      setUrlInput(targetUrl);

      const response = await fetch("/api/recorder/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testName, targetUrl, browser }),
      });

      if (!response.ok) throw new Error("Failed to start recording");

      sendMessage({ type: "RECORDING_STATUS", isRecording: true, testName, targetUrl, browser });
      showToast("Recording started. Interact with the browser.");
    } catch {
      showToast("Failed to start recording");
      setIsRecording(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      const response = await fetch("/api/recorder/stop", { method: "POST" });
      if (!response.ok) throw new Error("Failed to stop recording");

      sendMessage({ type: "RECORDING_STATUS", isRecording: false, steps: recordedSteps });
      setIsRecording(false);
      showToast("Recording stopped. Test steps captured.");
    } catch (error) {
      console.error("Error stopping recording:", error);
      showToast("Failed to stop recording");
    } finally {
      setIsRecording(false);
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
  const handleDeleteStep = (index: number) => {
    setRecordedSteps((prev) => prev.filter((_, i) => i !== index));
    showToast(`Deleted step ${index + 1}`);
  };
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    const url = urlInput.startsWith("http") ? urlInput : `https://${urlInput}`;
    setCurrentUrl(url);
    if (isRecording) setRecordedSteps((prev) => [...prev, `Navigate to ${url}`]);
  };

  const handleReload = () => {
    if (iframeRef.current) iframeRef.current.src = currentUrl;
  };

  // Inject recording script into iframe
  useEffect(() => {
    if (isRecording && iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.onload = () => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
  
        try {
          const script = doc.createElement("script");
          script.id="recorder-script";
          script.textContent = `
            (function() {
              const generateSelector = (element) => {
                if (element.id) return '#' + element.id;
                if (element.className && typeof element.className === 'string') {
                  return '.' + element.className.split(' ').join('.');
                }
                return element.tagName.toLowerCase();
              };
  
              const describeAction = (event) => {
                switch (event.type) {
                  case 'click':
                    return 'Clicked on ' + generateSelector(event.target);
                  case 'input':
                    return 'Entered "' + event.target.value + '" in ' + generateSelector(event.target);
                  case 'change':
                    return 'Changed value of ' + generateSelector(event.target);
                  default:
                    return 'Performed ' + event.type + ' on ' + generateSelector(event.target);
                }
              };
  
              const handleEvent = (event) => {
                const action = describeAction(event);
                window.parent.postMessage({ type: 'ACTION_RECORDED', action }, '*');
              };
  
              document.addEventListener('click', handleEvent, true);
              document.addEventListener('input', handleEvent, true);
              document.addEventListener('change', handleEvent, true);
            })();
          `;
          doc.head.appendChild(script);
        } catch (error) {
          console.error("Error injecting script into iframe:", error);
        }
      };
    }
  }, [isRecording, currentUrl]);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data.type === "ACTION_RECORDED") {
        const action = event.data.action;
        setRecordedSteps((prev) => {
          if (prev.includes(action)) {
            return prev;
            }
          return [...prev, action];
        });
        showToast(`Recorded: ${action}`);
      } else if (event.data.type === "RECORDING_STATUS") {
        const { isRecording, testName, targetUrl, browser } = event.data;
        setIsRecording(isRecording);
        if (isRecording) {
          setTestName(testName);
          setTargetUrl(targetUrl);
          setBrowser(browser);
        }
      }
    };
    window.addEventListener("message", handleIframeMessage);
    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Test Recorder</h1>
        <div className={`text-sm ${connected ? "text-green-600" : "text-red-500"}`}>
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Test Configuration */}
        <Card className="xl:col-span-2">
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
            <Button onClick={isRecording ? handleStopRecording : handleStartRecording} disabled={loading}>
              {loading ? "Loading..." : isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            <Button onClick={handlePlayRecording} disabled={isPlaying || !recordedSteps.length}>
              {isPlaying ? "Playing..." : "Play Recording"}
            </Button>
          </CardContent>
        </Card>

        {/* Browser Preview */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Browser Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUrlSubmit}>
              <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
              <Button type="submit">Go</Button>
              <Button onClick={handleReload}>Reload</Button>
            </form>
            <iframe ref={iframeRef} src={currentUrl} className="w-full h-96" />
          </CardContent>
        </Card>
      </div>

      {/* Recorded Steps */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recorded Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {recordedSteps.map((step, index) => (
              <li key={index} className="mb-2">
                {index + 1}. {step}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Delete Step */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Delete Step</CardTitle>
        </CardHeader>
        <CardContent>
          {recordedSteps.map((step, index) => (
            <div key={index} className="flex justify-between items-center mb-2">
              <span>{index + 1}. {step}</span>
              <Button variant="destructive" onClick={() => handleDeleteStep(index)}>Delete</Button>
            </div>
          ))} 
        </CardContent>
      </Card>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}