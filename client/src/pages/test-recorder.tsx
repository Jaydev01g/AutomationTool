import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Save, 
  Upload, 
  Download
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Simple toast component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded shadow-lg">
      {message}
    </div>
  );
}

export default function TestRecorder() {
  const [testName, setTestName] = useState("");
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const [browser, setBrowser] = useState("Chrome");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const showToast = (message: string) => {
    setToast(message);
  };

  const handleStartRecording = async () => {
    if (!testName) {
      showToast("Please enter a test name");
      return;
    }
    
    if (!targetUrl) {
      showToast("Please enter a target URL");
      return;
    }
    
    try {
      setIsRecording(true);
      setShowBrowser(true);
      setRecordedSteps([`Navigate to ${targetUrl}`]);
      setCurrentUrl(targetUrl);
      setUrlInput(targetUrl);
      
      // Send request to start recording on the server
      const response = await fetch("/api/recorder/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testName,
          targetUrl,
          browser,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start recording");
      }
      
      showToast("Recording started. Interact with the embedded browser");
    } catch (error) {
      showToast("Failed to start recording");
      setIsRecording(false);
    }
  };
  
  const handleStopRecording = async () => {
    try {
      // Send request to stop recording on the server
      const response = await fetch("/api/recorder/stop", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to stop recording");
      }
      
      setIsRecording(false);
      showToast("Recording stopped. Test steps captured");
    } catch (error) {
      showToast("Failed to stop recording");
    }
  };
  
  const handlePlayRecording = async () => {
    if (recordedSteps.length === 0) {
      showToast("No steps to play. Record some steps first");
      return;
    }
    
    try {
      setIsPlaying(true);
      setShowBrowser(true);
      
      // Send request to play recording on the server
      const response = await fetch("/api/recorder/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testName,
          browser,
          steps: recordedSteps,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to play recording");
      }
      
      showToast("Test execution complete");
    } catch (error) {
      showToast("Failed to play recording");
    } finally {
      setIsPlaying(false);
    }
  };
  
  const handleClearSteps = () => {
    setRecordedSteps([]);
  };
  
  const handleExportSteps = () => {
    const dataStr = JSON.stringify({
      testName,
      targetUrl,
      browser,
      steps: recordedSteps,
    });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${testName || 'test'}.json`);
    linkElement.click();
  };
  
  const handleImportSteps = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string;
          const importedData = JSON.parse(result);
          
          setTestName(importedData.testName || "");
          setTargetUrl(importedData.targetUrl || "");
          setBrowser(importedData.browser || "Chrome");
          setRecordedSteps(importedData.steps || []);
          
          showToast("Test imported successfully");
        } catch (error) {
          showToast("Failed to import test. Invalid file format");
        }
      };
      
      reader.readAsText(file);
      
      // Reset the file input value so the same file can be imported again
      fileInput.value = "";
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (urlInput) {
      // If missing protocol, add https://
      let url = urlInput;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
        setUrlInput(url);
      }
      
      setCurrentUrl(url);
      
      // Record navigation action
      if (isRecording) {
        setRecordedSteps(prev => [...prev, `Navigate to ${url}`]);
        showToast(`Recorded: Navigate to ${url}`);
      }
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  // Inject recording script into iframe
  useEffect(() => {
    if (isRecording && iframeRef.current) {
      try {
        setTimeout(() => {
          if (!iframeRef.current) return;
          const iframe = iframeRef.current;
          
          iframe.onload = function() {
            try {
              const doc = iframe.contentDocument || iframe.contentWindow?.document;
              if (!doc) return;
              
              // Create script element
              const script = doc.createElement('script');
              script.textContent = `
                (function() {
                  console.log('Recording script injected');
                  
                  // Send message to parent
                  function sendAction(action) {
                    window.parent.postMessage(action, '*');
                  }
                  
                  // Handle clicks
                  document.addEventListener('click', function(event) {
                    const target = event.target;
                    let selector = '';
                    
                    // Get selector
                    if (target.id) {
                      selector = '#' + target.id;
                    } else if (target.className && typeof target.className === 'string') {
                      selector = '.' + target.className.replace(/\\s+/g, '.');
                    } else {
                      selector = target.tagName.toLowerCase();
                    }
                    
                    sendAction({
                      type: 'click',
                      selector: selector,
                      text: target.textContent ? target.textContent.trim() : ''
                    });
                  }, true);
                  
                  // Handle inputs
                  document.addEventListener('change', function(event) {
                    const target = event.target;
                    if (target.tagName.toLowerCase() === 'input' || 
                        target.tagName.toLowerCase() === 'textarea' ||
                        target.tagName.toLowerCase() === 'select') {
                      
                      let selector = '';
                      if (target.id) {
                        selector = '#' + target.id;
                      } else if (target.name) {
                        selector = target.tagName.toLowerCase() + '[name="' + target.name + '"]';
                      } else {
                        selector = target.tagName.toLowerCase();
                      }
                      
                      sendAction({
                        type: 'input',
                        selector: selector,
                        value: target.value
                      });
                    }
                  }, true);
                  
                  // Handle form submissions
                  document.addEventListener('submit', function(event) {
                    const form = event.target;
                    let selector = '';
                    
                    if (form.id) {
                      selector = '#' + form.id;
                    } else if (form.className && typeof form.className === 'string') {
                      selector = '.' + form.className.replace(/\\s+/g, '.');
                    } else {
                      selector = 'form';
                    }
                    
                    sendAction({
                      type: 'submit',
                      selector: selector
                    });
                  }, true);
                })();
              `;
              
              doc.head.appendChild(script);
            } catch (err) {
              console.error('Error injecting script:', err);
            }
          };
        }, 1000);
      } catch (err) {
        console.error('Error setting up iframe:', err);
      }
    }
  }, [isRecording, currentUrl]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isRecording) return;
      
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      
      let step = "";
      
      switch (data.type) {
        case "click":
          step = data.text
            ? `Click on "${data.text}" (${data.selector})`
            : `Click on ${data.selector}`;
          break;
        case "input":
          if (!data.value) return;
          step = `Type "${data.value}" in ${data.selector}`;
          break;
        case "submit":
          step = `Submit form ${data.selector}`;
          break;
      }
      
      if (step && !recordedSteps.includes(step)) {
        setRecordedSteps(prev => [...prev, step]);
        showToast(`Recorded: ${step}`);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isRecording, recordedSteps]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Test Recorder</h1>
        <p className="text-slate-500 mt-1">Record browser interactions and create automated tests</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Settings Panel */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Configure your test parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullTestName">Test Name</Label>
              <Input
                id="fullTestName"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter test name..."
                disabled={isRecording || isPlaying}
              />
            </div>
            
            <div>
              <Label htmlFor="fullTargetUrl">Target URL</Label>
              <Input
                id="fullTargetUrl"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isRecording || isPlaying}
              />
            </div>
            
            <div>
              <Label htmlFor="fullBrowser">Browser</Label>
              <Select
                value={browser}
                onValueChange={setBrowser}
                disabled={isRecording || isPlaying}
              >
                <SelectTrigger id="fullBrowser">
                  <SelectValue placeholder="Select a browser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chrome">Chrome</SelectItem>
                  <SelectItem value="Firefox">Firefox</SelectItem>
                  <SelectItem value="Safari">Safari</SelectItem>
                  <SelectItem value="Edge">Edge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isPlaying || (!isRecording && (!testName || !targetUrl))}
                className="flex-1"
              >
                {isRecording ? <Square className="mr-2 h-4 w-4" /> : <span className="material-icons mr-1">●</span>}
                {isRecording ? "Stop" : "Record"}
              </Button>
              <Button
                variant="outline"
                onClick={handlePlayRecording}
                disabled={isRecording || isPlaying || recordedSteps.length === 0}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Play
              </Button>
            </div>
            
            <div className="border rounded-lg p-2">
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-medium">Recorded Steps</h3>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportSteps}
                    disabled={recordedSteps.length === 0 || isRecording || isPlaying}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      id="importFile"
                      accept=".json"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImportSteps}
                      disabled={isRecording || isPlaying}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isRecording || isPlaying}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSteps}
                    disabled={recordedSteps.length === 0 || isRecording || isPlaying}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded">
                {recordedSteps.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No steps recorded yet. Click "Record" to begin.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {recordedSteps.map((step, index) => (
                      <li key={index} className="p-2 text-sm hover:bg-gray-50">
                        <span className="inline-block w-6 h-6 mr-2 text-xs bg-primary/10 text-primary rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser Display */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Browser Preview</CardTitle>
            <CardDescription>
              {isRecording 
                ? "Recording interactions in the browser below" 
                : "Preview of the web application for testing"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="browser-container">
              <div className="browser-header flex flex-col p-2 border-b bg-slate-50">
                <form onSubmit={handleUrlSubmit} className="flex items-center space-x-2 mb-2">
                  <Input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter URL..."
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline" size="sm">Go</Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleReload}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              
              <div className="browser-content h-[500px] relative border">
                {!currentUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Enter a URL above and click "Record" to begin
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-0"
                    title="Browser Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {toast && (
        <Toast 
          message={toast} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
