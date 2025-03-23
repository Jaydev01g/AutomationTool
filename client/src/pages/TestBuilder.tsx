import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SearchIcon, PlayIcon, CircleIcon, SaveIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import TestSteps from "@/components/TestBuilder/TestSteps";
import ActionToolbox from "@/components/TestBuilder/ActionToolbox";
import ElementInspector from "@/components/TestBuilder/ElementInspector";
import TestResults from "@/components/TestBuilder/TestResults";
import RecordingModal from "@/components/TestBuilder/RecordingModal";
import { Test, TestAction, TestStep, SelectedElement, TestResult } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export default function TestBuilder() {
  const [test, setTest] = useState<Test>({
    id: 0,
    name: 'New Test',
    suiteId: 1,
    steps: []
  });
  const [isRecording, setIsRecording] = useState(false);
  const [lastRecordedAction, setLastRecordedAction] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get test suites for dropdown
  const { data: testSuites } = useQuery({
    queryKey: ['/api/test-suites'],
  });

  // Save test mutation
  const saveTestMutation = useMutation({
    mutationFn: (testData: Partial<Test>) => {
      return apiRequest('POST', '/api/tests', testData);
    },
    onSuccess: (response) => {
      response.json().then((savedTest) => {
        setTest(savedTest);
        queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
        toast({
          title: "Test saved",
          description: "Your test has been saved successfully"
        });
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving test",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Run test mutation
  const runTestMutation = useMutation({
    mutationFn: (testId: number) => {
      return apiRequest('POST', `/api/tests/${testId}/run`, {});
    },
    onSuccess: (response) => {
      response.json().then((results) => {
        setTestResults(results);
        toast({
          title: "Test execution completed",
          description: `${results.passed} steps passed, ${results.failed} steps failed`
        });
      });
    },
    onError: (error) => {
      toast({
        title: "Error running test",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleRecord = () => {
    setIsRecording(true);
    
    // Start recording via websocket or API
    fetch('/api/recording/start', {
      method: 'POST',
    })
      .then(res => res.json())
      .then(() => {
        // Listen for recorded actions via WebSocket or polling
        // Determine if we should use secure WebSockets based on the page protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/recording/ws`);
        
        ws.onopen = () => {
          console.log('WebSocket connection established');
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast({
            title: "WebSocket Connection Error",
            description: "Could not establish real-time communication",
            variant: "destructive"
          });
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'action') {
            setLastRecordedAction(data.description);
            
            // Add the step to the test
            setTest(prev => ({
              ...prev,
              steps: [...prev.steps, data.step]
            }));
          }
        };
        
        // Clean up WebSocket on component unmount
        return () => ws.close();
      })
      .catch(error => {
        toast({
          title: "Error starting recording",
          description: error.message,
          variant: "destructive"
        });
        setIsRecording(false);
      });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    // Stop recording via API
    fetch('/api/recording/stop', {
      method: 'POST',
    });
  };

  const handleElementPicker = () => {
    toast({
      title: "Element selector activated",
      description: "Click on any element in your web page to select it"
    });
    
    // Element picker logic would be implemented with a browser extension
    // or iframe integration in a real implementation
    
    // Mock selection for demo
    setTimeout(() => {
      setSelectedElement({
        selector: '#login-form input[name="username"]',
        type: 'input',
        tagName: 'INPUT',
        attributes: {
          type: 'text',
          name: 'username',
          placeholder: 'Username'
        }
      });
    }, 1000);
  };

  const handleSave = () => {
    saveTestMutation.mutate({
      name: test.name,
      suiteId: test.suiteId,
      steps: test.steps
    });
  };

  const handlePlayback = () => {
    if (test.id === 0) {
      // Save test first if it's new
      saveTestMutation.mutate({
        name: test.name,
        suiteId: test.suiteId,
        steps: test.steps
      }, {
        onSuccess: (response) => {
          response.json().then((savedTest) => {
            setTest(savedTest);
            runTestMutation.mutate(savedTest.id);
          });
        }
      });
    } else {
      runTestMutation.mutate(test.id);
    }
  };

  const handleAction = (action: TestAction) => {
    // Process dropped or selected action
    if (selectedElement && (action.type === 'click' || action.type === 'type' || action.type === 'verify')) {
      const newStep: Partial<TestStep> = {
        type: action.type,
        order: test.steps.length,
        selector: selectedElement.selector
      };
      
      if (action.type === 'type') {
        newStep.text = '';
      } else if (action.type === 'verify') {
        newStep.condition = 'exists';
      }
      
      setTest(prev => ({
        ...prev,
        steps: [...prev.steps, newStep as TestStep]
      }));
      
      toast({
        title: "Step added",
        description: `${action.type} action added for element ${selectedElement.selector}`
      });
    } else if (action.type === 'navigate') {
      setTest(prev => ({
        ...prev,
        steps: [...prev.steps, {
          id: Date.now(), // Temporary ID
          type: 'navigate',
          order: test.steps.length,
          url: 'https://example.com'
        }]
      }));
      
      toast({
        title: "Step added",
        description: "Navigate action added"
      });
    } else if (action.type === 'wait') {
      setTest(prev => ({
        ...prev,
        steps: [...prev.steps, {
          id: Date.now(), // Temporary ID
          type: 'wait',
          order: test.steps.length,
          duration: 1000
        }]
      }));
      
      toast({
        title: "Step added",
        description: "Wait action added"
      });
    } else if (action.type === 'scroll') {
      setTest(prev => ({
        ...prev,
        steps: [...prev.steps, {
          id: Date.now(), // Temporary ID
          type: 'scroll',
          order: test.steps.length,
          direction: 'down'
        }]
      }));
      
      toast({
        title: "Step added",
        description: "Scroll action added"
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Test Builder</h1>
        <p className="text-gray-600">Create, edit, and execute your automated tests</p>
      </div>

      {/* Test Configuration & Actions */}
      <div className="flex mb-6 space-x-4">
        <div className="bg-white shadow rounded-lg p-4 flex-1 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Quick Actions</h2>
          <div className="flex space-x-2">
            <Button 
              onClick={handleRecord}
              className="bg-primary hover:bg-blue-600 text-white"
            >
              <CircleIcon className="h-4 w-4 mr-1.5 text-red-500 fill-red-500" />
              Record
            </Button>
            <Button 
              onClick={handlePlayback}
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <PlayIcon className="h-4 w-4 mr-1.5" />
              Play
            </Button>
            <Button 
              onClick={handleElementPicker}
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <SearchIcon className="h-4 w-4 mr-1.5" />
              Select Element
            </Button>
            <Button 
              onClick={handleSave}
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <SaveIcon className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4 flex-1 border border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-2">Test Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <Input 
                type="text" 
                value={test.name} 
                onChange={(e) => setTest({ ...test, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Suite</label>
              <Select 
                value={test.suiteId.toString()} 
                onValueChange={(value) => setTest({ ...test, suiteId: parseInt(value) })}
              >
                <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <SelectValue placeholder="Select test suite" />
                </SelectTrigger>
                <SelectContent>
                  {testSuites?.map((suite: any) => (
                    <SelectItem key={suite.id} value={suite.id.toString()}>
                      {suite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Test Builder Grid */}
      <div className="grid grid-cols-3 gap-6">
        <TestSteps testId={test.id} testSteps={test.steps} />
        
        <div className="col-span-1">
          <ActionToolbox onActionSelected={handleAction} />
          <ElementInspector 
            selectedElement={selectedElement} 
            onSelectElement={handleElementPicker} 
          />
        </div>
      </div>

      {/* Test Results */}
      <TestResults testResults={testResults} />

      {/* Recording Modal */}
      <RecordingModal 
        isOpen={isRecording} 
        onClose={handleStopRecording} 
        onPause={() => {
          toast({
            title: "Recording paused",
            description: "You can resume recording anytime"
          });
        }} 
        lastAction={lastRecordedAction} 
      />
    </div>
  );
}
