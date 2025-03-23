import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecordedSteps } from "@/components/recorder/recorded-steps";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Save, 
  Upload, 
  Download, 
  Settings,
  Trash2,
  Mouse,
  MousePointer,
  Keyboard,
  FileText,
  Eye,
  ArrowRight,
  Plus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function BrowserRecorder() {
  const { toast } = useToast();
  const [testName, setTestName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [browser, setBrowser] = useState("Chrome");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("recorder");
  
  // User action recording
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [selectorValue, setSelectorValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [waitValue, setWaitValue] = useState("");
  const [assertValue, setAssertValue] = useState("");
  
  const handleStartRecording = async () => {
    if (!testName) {
      toast({
        title: "Test name required",
        description: "Please enter a test name",
        variant: "destructive",
      });
      return;
    }
    
    if (!targetUrl) {
      toast({
        title: "Target URL required",
        description: "Please enter a target URL",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsRecording(true);
      const response = await apiRequest("POST", "/api/recorder/start", {
        testName,
        targetUrl,
        browser,
      });
      
      // Initialize with the first navigation step
      setRecordedSteps([`Navigate to ${targetUrl}`]);
      
      toast({
        title: "Recording started",
        description: "Add steps manually using the 'Add Action' button",
      });
    } catch (error) {
      toast({
        title: "Failed to start recording",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };
  
  const handleStopRecording = async () => {
    try {
      await apiRequest("POST", "/api/recorder/stop", {});
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Your test steps have been captured",
      });
    } catch (error) {
      toast({
        title: "Failed to stop recording",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handlePlayRecording = async () => {
    if (recordedSteps.length === 0) {
      toast({
        title: "No steps to play",
        description: "Record some steps first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPlaying(true);
      await apiRequest("POST", "/api/recorder/play", {
        testName,
        browser,
        steps: recordedSteps,
      });
      
      toast({
        title: "Test execution complete",
        description: "The test has been executed successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to play recording",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  };
  
  const handleSaveTest = async () => {
    if (recordedSteps.length === 0) {
      toast({
        title: "No steps to save",
        description: "Record some steps first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest("POST", "/api/tests", {
        name: testName,
        targetUrl,
        browser,
        steps: recordedSteps,
      });
      
      toast({
        title: "Test saved",
        description: "The test has been saved successfully",
      });
      
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
    } catch (error) {
      toast({
        title: "Failed to save test",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
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
          
          toast({
            title: "Test imported",
            description: "The test has been imported successfully",
          });
        } catch (error) {
          toast({
            title: "Failed to import test",
            description: "Invalid test file format",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsText(file);
      
      // Reset the file input value so the same file can be imported again
      fileInput.value = "";
    }
  };

  const openActionDialog = (type: string) => {
    setActionType(type);
    setSelectorValue("");
    setTextValue("");
    setUrlValue("");
    setWaitValue("");
    setAssertValue("");
    setActionDialogOpen(true);
  };

  const handleAddAction = () => {
    let step = "";
    
    switch (actionType) {
      case "click":
        if (!selectorValue) return;
        step = textValue 
          ? `Click on "${textValue}" (${selectorValue})`
          : `Click on ${selectorValue}`;
        break;
      case "type":
        if (!selectorValue || !textValue) return;
        step = `Type "${textValue}" in ${selectorValue}`;
        break;
      case "navigate":
        if (!urlValue) return;
        step = `Navigate to ${urlValue}`;
        break;
      case "wait":
        if (!waitValue) return;
        step = waitValue.includes("selector") 
          ? `Wait for ${selectorValue} to be visible`
          : waitValue === "navigation"
          ? "Wait for navigation"
          : `Wait for ${waitValue} ms`;
        break;
      case "assert":
        if (!assertValue) return;
        step = assertValue.includes("visible")
          ? `Assert ${selectorValue} is visible`
          : assertValue.includes("count")
          ? `Assert ${selectorValue} count > 0`
          : `Assert URL contains "${textValue}"`;
        break;
      default:
        return;
    }
    
    if (step) {
      setRecordedSteps([...recordedSteps, step]);
      setActionDialogOpen(false);
      toast({
        title: "Step added",
        description: `Added: ${step}`
      });
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Browser Test Recorder</CardTitle>
          <CardDescription>
            Record, play, and manage browser automation tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="recorder">Recorder</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recorder" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-4">
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
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="space-x-2">
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        disabled={isPlaying || (!isRecording && (!testName || !targetUrl))}
                      >
                        {isRecording ? <Square className="mr-2 h-4 w-4" /> : <span className="material-icons mr-1">fiber_manual_record</span>}
                        {isRecording ? "Stop" : "Record"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handlePlayRecording}
                        disabled={isRecording || isPlaying || recordedSteps.length === 0}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </Button>
                    </div>
                    
                    <div className="space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearSteps}
                        disabled={recordedSteps.length === 0 || isRecording || isPlaying}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveTest}
                        disabled={recordedSteps.length === 0 || isRecording || isPlaying}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-700">Recorded Steps</h3>
                    <div className="flex items-center space-x-1">
                      {isRecording && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setActionDialogOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Action
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleExportSteps}
                        disabled={recordedSteps.length === 0 || isRecording || isPlaying}
                      >
                        <Download className="h-4 w-4 text-slate-500" />
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
                          size="icon"
                          className="h-8 w-8"
                          disabled={isRecording || isPlaying}
                        >
                          <Upload className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleClearSteps}
                        disabled={recordedSteps.length === 0 || isRecording || isPlaying}
                      >
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                      </Button>
                    </div>
                  </div>
                  <RecordedSteps steps={recordedSteps} height="h-[400px]" />

                  {isRecording && (
                    <div className="p-3 border-t bg-slate-50">
                      <p className="text-sm text-center mb-2 text-slate-600 font-medium">Add Action:</p>
                      <div className="grid grid-cols-5 gap-2">
                        <Button variant="outline" size="sm" onClick={() => openActionDialog("click")}>
                          <MousePointer className="h-3 w-3 mr-1" /> Click
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openActionDialog("type")}>
                          <Keyboard className="h-3 w-3 mr-1" /> Type
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openActionDialog("navigate")}>
                          <ArrowRight className="h-3 w-3 mr-1" /> Navigate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openActionDialog("wait")}>
                          <FileText className="h-3 w-3 mr-1" /> Wait
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openActionDialog("assert")}>
                          <Eye className="h-3 w-3 mr-1" /> Assert
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="captureScreenshots">Capture Screenshots</Label>
                  <Select defaultValue="onFailure">
                    <SelectTrigger id="captureScreenshots">
                      <SelectValue placeholder="Capture screenshots" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="onFailure">On Failure</SelectItem>
                      <SelectItem value="always">Always</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timeout">Element Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    defaultValue="10"
                    min="1"
                    max="60"
                  />
                </div>
                
                <div>
                  <Label htmlFor="waitBetweenSteps">Wait Between Steps (ms)</Label>
                  <Input
                    id="waitBetweenSteps"
                    type="number"
                    defaultValue="500"
                    min="0"
                    max="5000"
                    step="100"
                  />
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" className="mr-2">
                    <Settings className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                  <Button>
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "click" && "Add Click Action"}
              {actionType === "type" && "Add Type Action"}
              {actionType === "navigate" && "Add Navigation Action"}
              {actionType === "wait" && "Add Wait Action"}
              {actionType === "assert" && "Add Assertion"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "click" && "Add a click interaction on an element"}
              {actionType === "type" && "Add text input to a form field"}
              {actionType === "navigate" && "Navigate to a URL"}
              {actionType === "wait" && "Wait for an element or event"}
              {actionType === "assert" && "Add a verification step"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(actionType === "click" || actionType === "type" || (actionType === "wait" && waitValue === "selector") || (actionType === "assert" && assertValue.includes("selector"))) && (
              <div>
                <Label htmlFor="selector">CSS Selector</Label>
                <Input
                  id="selector"
                  placeholder="#id, .class, tag[attr]"
                  value={selectorValue}
                  onChange={(e) => setSelectorValue(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Examples: #loginButton, .form-input, button[type="submit"]
                </p>
              </div>
            )}

            {(actionType === "click" || actionType === "type" || (actionType === "assert" && assertValue === "url")) && (
              <div>
                <Label htmlFor="text">
                  {actionType === "click" ? "Button/Link Text (optional)" : 
                   actionType === "type" ? "Text to Type" :
                   "Text to Assert"}
                </Label>
                <Input
                  id="text"
                  placeholder={actionType === "click" ? "Login" : actionType === "type" ? "username@example.com" : "dashboard"}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                />
              </div>
            )}

            {actionType === "navigate" && (
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/path"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                />
              </div>
            )}

            {actionType === "wait" && (
              <div>
                <Label htmlFor="waitType">Wait Type</Label>
                <Select value={waitValue} onValueChange={setWaitValue}>
                  <SelectTrigger id="waitType">
                    <SelectValue placeholder="Select what to wait for" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selector">Element to be visible</SelectItem>
                    <SelectItem value="navigation">Navigation to complete</SelectItem>
                    <SelectItem value="timeout">Timeout (ms)</SelectItem>
                  </SelectContent>
                </Select>

                {waitValue === "timeout" && (
                  <div className="mt-4">
                    <Label htmlFor="timeoutValue">Timeout (milliseconds)</Label>
                    <Input
                      id="timeoutValue"
                      type="number"
                      placeholder="1000"
                      value={waitValue}
                      onChange={(e) => setWaitValue(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {actionType === "assert" && (
              <div>
                <Label htmlFor="assertType">Assertion Type</Label>
                <Select value={assertValue} onValueChange={setAssertValue}>
                  <SelectTrigger id="assertType">
                    <SelectValue placeholder="Select assertion type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selector-visible">Element is visible</SelectItem>
                    <SelectItem value="selector-count">Element count</SelectItem>
                    <SelectItem value="url">URL contains text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddAction}>Add Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
