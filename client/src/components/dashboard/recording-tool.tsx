import { RecordedSteps } from "@/components/recorder/recorded-steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  HelpCircle,
  Save,
  Settings,
  Trash2
} from "lucide-react";
import { useState } from "react";

export function RecordingTool() {
  const { toast } = useToast();
  const [testName, setTestName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [browser, setBrowser] = useState("Chrome");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
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
      
      const data = await response.json();
      toast({
        title: "Recording started",
        description: "Perform actions on the target website",
      });
      
      // Start polling for steps
      pollRecordedSteps();
    } catch (error) {
      toast({
        title: "Failed to start recording",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };
  
  const pollRecordedSteps = async () => {
    if (!isRecording) return;
    
    try {
      const response = await fetch("/api/recorder/steps");
      const data = await response.json();
      setRecordedSteps(data.steps);
      
      setTimeout(pollRecordedSteps, 1000);
    } catch (error) {
      console.error("Error polling steps:", error);
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
      
      // Reset form
      setTestName("");
      setTargetUrl("");
      setBrowser("Chrome");
      setRecordedSteps([]);
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="font-semibold text-lg text-slate-800">Quick Test Recorder</h2>
      </div>
      <div className="p-6">
        <div className="mb-5">
          <Label htmlFor="testName" className="mb-1">Test Name</Label>
          <Input
            id="testName"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Enter test name..."
            disabled={isRecording || isPlaying}
          />
        </div>
        
        <div className="mb-5">
          <Label htmlFor="targetUrl" className="mb-1">Target URL</Label>
          <Input
            id="targetUrl"
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={isRecording || isPlaying}
          />
        </div>
        
        <div className="mb-5">
          <Label htmlFor="browser" className="mb-1">Browser</Label>
          <Select
            value={browser}
            onValueChange={setBrowser}
            disabled={isRecording || isPlaying}
          >
            <SelectTrigger id="browser">
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
        
        <div className="mb-6 border rounded-lg p-4 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">Recording Controls</h3>
            <div className="flex items-center space-x-1">
              <Button className="h-8 w-8" title="Settings">
                <Settings className="h-4 w-4 text-slate-500" />
              </Button>
              <Button className="h-8 w-8" title="Help">
                <HelpCircle className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              className="flex-1 mr-2 bg-error hover:bg-error/90"
              onClick={handleStartRecording}
              disabled={isRecording || isPlaying || !testName || !targetUrl}
            >
              <span className="material-icons mr-1">fiber_manual_record</span>
              Record
            </Button>
            <Button
              className="flex-1 mr-2 bg-success hover:bg-success/90"
              onClick={handlePlayRecording}
              disabled={isRecording || isPlaying || recordedSteps.length === 0}
            >
              <span className="material-icons mr-1">play_arrow</span>
              Play
            </Button>
            <Button
              className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
              onClick={handleStopRecording}
              disabled={!isRecording || isPlaying}
            >
              <span className="material-icons mr-1">stop</span>
              Stop
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-3 py-2 border-b flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">Recorded Steps</h3>
            <Button
              className="h-8 w-8 bg-transparent hover:bg-slate-200"
              onClick={handleClearSteps}
              disabled={recordedSteps.length === 0 || isRecording || isPlaying}
            >
              <Trash2 className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
          <RecordedSteps steps={recordedSteps} />
        </div>
        
        <div className="mt-6 flex justify-between">
          <Button className="text-slate-500 hover:text-slate-700 border border-slate-300" disabled={isRecording || isPlaying}>
            <Save className="h-4 w-4 mr-1" />
            Save as Template
          </Button>
          <Button
            onClick={handleSaveTest}
            disabled={recordedSteps.length === 0 || isRecording || isPlaying}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Test
          </Button>
        </div>
      </div>
    </div>
  );
}
