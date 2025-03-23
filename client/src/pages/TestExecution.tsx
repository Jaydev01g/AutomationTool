import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  TimerIcon, 
  ArrowDownIcon,
  ArrowUpIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Test, TestRun } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

export default function TestExecution() {
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [currentExecution, setCurrentExecution] = useState<TestRun | null>(null);
  const { toast } = useToast();

  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ['/api/tests'],
  });

  const { data: testSuites, isLoading: suitesLoading } = useQuery({
    queryKey: ['/api/test-suites'],
  });

  const handleSelectTest = (testId: number) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId) 
        : [...prev, testId]
    );
  };

  const handleSelectAll = () => {
    if (tests) {
      if (selectedTests.length === tests.length) {
        setSelectedTests([]);
      } else {
        setSelectedTests(tests.map(test => test.id));
      }
    }
  };

  const handleRunTests = () => {
    if (selectedTests.length === 0) {
      toast({
        title: "No tests selected",
        description: "Please select at least one test to run",
        variant: "destructive"
      });
      return;
    }

    // Start execution
    fetch('/api/test-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testIds: selectedTests }),
    })
      .then(res => res.json())
      .then((run) => {
        setCurrentExecution(run);
        trackExecution(run.id);
        toast({
          title: "Test execution started",
          description: `Running ${selectedTests.length} tests`
        });
      })
      .catch(error => {
        toast({
          title: "Error starting tests",
          description: error.message,
          variant: "destructive"
        });
      });
  };

  const trackExecution = (runId: number) => {
    // In a real app, this would use WebSockets for real-time updates
    const interval = setInterval(() => {
      fetch(`/api/test-runs/${runId}`)
        .then(res => res.json())
        .then((run) => {
          setCurrentExecution(run);
          
          if (run.status === 'completed' || run.status === 'failed') {
            clearInterval(interval);
            toast({
              title: `Test execution ${run.status}`,
              description: `${run.passedTests} passed, ${run.failedTests} failed`
            });
          }
        })
        .catch(() => {
          clearInterval(interval);
        });
    }, 1000);
    
    return () => clearInterval(interval);
  };
  
  const getSuiteName = (suiteId: number) => {
    return testSuites?.find((suite: any) => suite.id === suiteId)?.name || 'Unknown Suite';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Test Execution</h1>
        <p className="text-gray-600">Run and monitor automated tests</p>
      </div>

      {/* Current Execution Status */}
      {currentExecution && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Current Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="font-medium">Status: </span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    currentExecution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    currentExecution.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentExecution.status.charAt(0).toUpperCase() + currentExecution.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Started: {new Date(currentExecution.startTime).toLocaleString()}
                </div>
              </div>
              
              <Progress 
                value={(currentExecution.completedTests / currentExecution.totalTests) * 100} 
                className="h-2" 
              />
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{currentExecution.completedTests} of {currentExecution.totalTests} tests completed</span>
                <span>{Math.round((currentExecution.completedTests / currentExecution.totalTests) * 100)}%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Passed</div>
                  <div className="font-bold">{currentExecution.passedTests}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Failed</div>
                  <div className="font-bold">{currentExecution.failedTests}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                  <TimerIcon className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-bold">
                    {currentExecution.endTime 
                      ? `${Math.round((new Date(currentExecution.endTime).getTime() - new Date(currentExecution.startTime).getTime()) / 1000)}s`
                      : 'Running...'
                    }
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" disabled={currentExecution.status !== 'running'}>
                <PauseIcon className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button variant="outline" size="sm" disabled={currentExecution.status !== 'running'}>
                <StopIcon className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Selection and Execution */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle>Test Cases</CardTitle>
            <Button 
              onClick={handleRunTests}
              disabled={selectedTests.length === 0}
            >
              <PlayIcon className="h-4 w-4 mr-1.5" />
              Run Selected Tests
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Loading tests...</div>
            ) : (
              <>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Checkbox 
                              id="select-all"
                              checked={tests && selectedTests.length === tests.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Suite
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Run
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tests?.map((test) => (
                        <tr key={test.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Checkbox 
                              checked={selectedTests.includes(test.id)}
                              onCheckedChange={() => handleSelectTest(test.id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{test.name}</div>
                            <div className="text-xs text-gray-500">{test.steps.length} steps</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSuiteName(test.suiteId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {test.lastRun ? new Date(test.lastRun).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {test.lastStatus ? (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                test.lastStatus === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {test.lastStatus.charAt(0).toUpperCase() + test.lastStatus.slice(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button variant="outline" size="sm">
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      
                      {tests?.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            No tests available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
