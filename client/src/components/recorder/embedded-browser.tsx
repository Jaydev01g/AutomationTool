import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EmbeddedBrowserProps {
  targetUrl: string;
  isRecording: boolean;
  onAction: (action: { type: string; selector: string; value?: string; text?: string }) => void;
}

export function EmbeddedBrowser({ targetUrl, isRecording, onAction }: EmbeddedBrowserProps) {
  const [currentUrl, setCurrentUrl] = useState(targetUrl);
  const [urlInput, setUrlInput] = useState(targetUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const browserRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyPosition, setHistoryPosition] = useState(-1);
  const [lastClickedElement, setLastClickedElement] = useState<string | null>(null);

  useEffect(() => {
    setUrlInput(targetUrl);
    setCurrentUrl(targetUrl);
    setHistory([targetUrl]);
    setHistoryPosition(0);
  }, [targetUrl]);

  // Handle loading a new URL
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (urlInput) {
      let url = urlInput;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
        setUrlInput(url);
      }

      navigateToUrl(url);
    }
  };

  // Navigate to a URL and update history
  const navigateToUrl = (url: string) => {
    setCurrentUrl(url);

    if (historyPosition < history.length - 1) {
      const newHistory = history.slice(0, historyPosition + 1);
      setHistory([...newHistory, url]);
      setHistoryPosition(newHistory.length);
    } else {
      setHistory([...history, url]);
      setHistoryPosition(history.length);
    }

    if (isRecording) {
      onAction({
        type: "navigate",
        selector: "",
        value: url,
      });
    }
  };

  // Go back in history
  const handleBack = () => {
    if (historyPosition > 0) {
      const newPosition = historyPosition - 1;
      setHistoryPosition(newPosition);
      setCurrentUrl(history[newPosition]);
      setUrlInput(history[newPosition]);
    }
  };

  // Go forward in history
  const handleForward = () => {
    if (historyPosition < history.length - 1) {
      const newPosition = historyPosition + 1;
      setHistoryPosition(newPosition);
      setCurrentUrl(history[newPosition]);
      setUrlInput(history[newPosition]);
    }
  };

  // Reload the iframe
  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Setup event listener for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type && event.data.type.startsWith("RECORDER_")) {
        console.log("Received recorder action:", event.data);

        if (isRecording) {
          onAction({
            type: event.data.type.replace("RECORDER_", "").toLowerCase(),
            selector: event.data.selector,
            value: event.data.value,
            text: event.data.text,
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isRecording, onAction]);

  // Inject our recording script into the iframe
  useEffect(() => {
    const injectRecordingScript = () => {
      setTimeout(() => {
        try {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            const doc = iframeRef.current.contentWindow.document;

            if (!doc.getElementById("recorder-script")) {
              const script = doc.createElement("script");
              script.id = "recorder-script";
              script.textContent = `
                (function() {
                  console.log('Recording script injected');

                  const generateSelector = (element) => {
                    if (element.id) return '#' + element.id;
                    if (element.className && typeof element.className === 'string') {
                      return '.' + element.className.replace(/\\s+/g, '.');
                    }
                    if (element.tagName) {
                      let selector = element.tagName.toLowerCase();
                      if (element.hasAttribute('name')) {
                        selector += '[name="' + element.getAttribute('name') + '"]';
                      }
                      return selector;
                    }
                    return 'unknown';
                  };

                  // Handle clicks
                  document.addEventListener('click', function(event) {
                    const target = event.target;
                    const selector = generateSelector(target);

                    window.parent.postMessage({
                      type: 'RECORDER_CLICK',
                      selector: selector,
                      text: target.textContent ? target.textContent.trim() : '',
                    }, '*');
                  }, true);

                  // Handle input changes
                  document.addEventListener('change', function(event) {
                    const target = event.target;
                    const selector = generateSelector(target);

                    window.parent.postMessage({
                      type: 'RECORDER_INPUT',
                      selector: selector,
                      value: target.value,
                    }, '*');
                  }, true);

                  // Handle form submissions
                  document.addEventListener('submit', function(event) {
                    const form = event.target;
                    const selector = generateSelector(form);

                    window.parent.postMessage({
                      type: 'RECORDER_SUBMIT',
                      selector: selector,
                    }, '*');
                  }, true);
                })();
              `;

              doc.head.appendChild(script);
              console.log("Injected recording script into iframe");
            }
          }
        } catch (err) {
          console.error("Error injecting script:", err);
        }
      }, 1500);
    };

    if (isRecording) {
      injectRecordingScript();
    }
  }, [isRecording, currentUrl]);

  return (
    <div
      ref={browserRef}
      className={`browser-container flex flex-col border rounded-lg overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-[600px]"
      }`}
    >
      <div className="browser-header bg-slate-100 px-3 py-2 border-b flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Button
              className="variant-ghost"
              onClick={handleBack}
              disabled={historyPosition <= 0}
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
            </Button>
            <Button
              className="variant-ghost"
              onClick={handleForward}
              disabled={historyPosition >= history.length - 1}
            >
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </Button>
            <Button className="variant-ghost h-8 w-8 icon" onClick={handleReload}>
              <RotateCcw className="h-4 w-4 text-slate-500" />
            </Button>
            <Button
              className="variant-ghost h-8 w-8"
              onClick={() => {
                setCurrentUrl(targetUrl);
                setUrlInput(targetUrl);
              }}
            >
              <Home className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
          <Button className="h-8 w-8" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-slate-500" />
            ) : (
              <Maximize2 className="h-4 w-4 text-slate-500" />
            )}
          </Button>
        </div>
        <form onSubmit={handleUrlSubmit} className="flex items-center">
          <Input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL..."
            className="w-full"
          />
        </form>
        {isRecording && lastClickedElement && (
          <div className="mt-2 text-xs bg-green-50 text-green-700 p-1 rounded border border-green-200">
            Last action: {lastClickedElement}
          </div>
        )}
      </div>

      <div className="browser-content flex-1 bg-white relative">
        {!isRecording && (
          <div className="absolute inset-0 z-10 bg-transparent pointer-events-none" />
        )}

        <iframe
          ref={iframeRef}
          src={currentUrl}
          className="w-full h-full border-0"
          title="Browser Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  );
}