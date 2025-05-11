import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { TestStep } from "@/lib/types";
import {
  CheckCircleIcon,
  ChevronsUpDownIcon,
  KeyboardIcon,
  MousePointerIcon,
  PlusIcon,
  TimerIcon,
  TouchpadIcon,
  TrashIcon
} from "lucide-react";
import { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

interface TestStepsProps {
  testId: number;
  testSteps: TestStep[];
}

export default function TestSteps({ testId, testSteps }: TestStepsProps) {
  const [steps, setSteps] = useState<TestStep[]>(testSteps || []);
  const { toast } = useToast();

  const handleAddStep = () => {
    fetch(`/api/tests/${testId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'navigate',
        url: 'https://example.com',
        order: steps.length
      }),
    })
      .then(res => res.json())
      .then((newStep) => {
        setSteps([...steps, newStep]);
        queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
        toast({
          title: "Step added",
          description: "New step has been added to the test"
        });
      });
  };

  const handleDeleteStep = (stepId: number) => {
    fetch(`/api/tests/${testId}/steps/${stepId}`, {
      method: 'DELETE',
    })
      .then(() => {
        setSteps(steps.filter(step => step.id !== stepId));
        queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
        toast({
          title: "Step deleted",
          description: "Step has been removed from the test"
        });
      });
  };

  const handleClearSteps = () => {
    fetch(`/api/tests/${testId}/steps`, {
      method: 'DELETE',
    })
      .then(() => {
        setSteps([]);
        queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
        toast({
          title: "All steps cleared",
          description: "All steps have been removed from the test"
        });
      });
  };

  const handleUpdateStep = (stepId: number, data: Partial<TestStep>) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, ...data } : step
    );
    
    setSteps(updatedSteps);
    
    fetch(`/api/tests/${testId}/steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const reorderedSteps = Array.from(steps);
    const [removed] = reorderedSteps.splice(result.source.index, 1);
    reorderedSteps.splice(result.destination.index, 0, removed);
    
    // Update order property on each step
    const updatedSteps = reorderedSteps.map((step, index) => ({
      ...step,
      order: index
    }));
    
    setSteps(updatedSteps);
    
    // Update the order on the server
    fetch(`/api/tests/${testId}/steps/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: updatedSteps.map(s => ({ id: s.id, order: s.order })) }),
    });
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'navigate': return <MousePointerIcon className="h-4 w-4 text-gray-500" />;
      case 'click': return <TouchpadIcon className="h-4 w-4 text-gray-500" />;
      case 'type': return <KeyboardIcon className="h-4 w-4 text-gray-500" />;
      case 'verify': return <CheckCircleIcon className="h-4 w-4 text-gray-500" />;
      case 'wait': return <TimerIcon className="h-4 w-4 text-gray-500" />;
      case 'scroll': return <ChevronsUpDownIcon className="h-4 w-4 text-gray-500" />;
      default: return <MousePointerIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="col-span-2 bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
        <h3 className="font-medium text-gray-800">Test Steps</h3>
        <div className="flex space-x-2">
          <Button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1"
            onClick={handleAddStep}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            <span>Add Step</span>
          </Button>
          <Button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1"
            onClick={handleClearSteps}
          >
            <span>Clear All</span>
          </Button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="test-steps">
          {(provided) => (
            <div 
              ref={provided.innerRef} 
              {...provided.droppableProps}
              className="p-4 max-h-[500px] overflow-y-auto"
            >
              {steps.length === 0 && (
                <div className="text-center py-12">
                  <MousePointerIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500">No test steps yet. Click "Record" to start capturing actions.</p>
                </div>
              )}
              
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={`step-${step.id}`} index={index}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.draggableProps} 
                      {...provided.dragHandleProps}
                      className="relative mb-4 pl-12 test-step"
                    >
                      <div className="step-connector"></div>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 relative z-10">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm z-20">
                          {index + 1}
                        </div>
                        <div className="flex justify-between">
                          <div className="flex items-center space-x-2">
                            {getStepIcon(step.type)}
                            <h4 className="font-medium capitalize">{step.type}</h4>
                          </div>
                          <div className="flex space-x-1">
                            <button className="text-gray-400 hover:text-gray-600" onClick={() => handleDeleteStep(step.id)}>
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {step.type === 'navigate' && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">URL:</div>
                            <Input
                              type="text"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm mt-1"
                              value={step.url || ''}
                              onChange={(e) => handleUpdateStep(step.id, { url: e.target.value })}
                            />
                          </div>
                        )}
                        
                        {step.type === 'click' && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">Element:</div>
                            <div className="bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-sm font-mono mt-1">
                              {step.selector}
                            </div>
                          </div>
                        )}
                        
                        {step.type === 'type' && (
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-sm text-gray-600">Element:</div>
                              <div className="bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-sm font-mono mt-1">
                                {step.selector}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Text:</div>
                              <Input
                                type="text"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm mt-1"
                                value={step.text || ''}
                                onChange={(e) => handleUpdateStep(step.id, { text: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                        
                        {step.type === 'verify' && (
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-sm text-gray-600">Element:</div>
                              <div className="bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-sm font-mono mt-1">
                                {step.selector}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Condition:</div>
                              <Select 
                                value={step.condition || 'exists'} 
                                onValueChange={(value: string) => handleUpdateStep(step.id, { condition: value })}
                              >
                                <SelectTrigger className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm mt-1">
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="exists">Exists</SelectItem>
                                  <SelectItem value="visible">Is Visible</SelectItem>
                                  <SelectItem value="contains">Contains Text</SelectItem>
                                  <SelectItem value="value">Has Value</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        
                        {step.type === 'wait' && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">Duration (ms):</div>
                            <Input
                              type="number"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm mt-1"
                              value={step.duration || 1000}
                              onChange={(e) => handleUpdateStep(step.id, { duration: parseInt(e.target.value) })}
                            />
                          </div>
                        )}
                        
                        {step.type === 'scroll' && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">Direction:</div>
                            <Select 
                              value={step.direction || 'down'} 
                              onValueChange={(value: string) => handleUpdateStep(step.id, { direction: value })}
                            >
                              <SelectTrigger className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm mt-1">
                                <SelectValue placeholder="Select direction" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="up">Up</SelectItem>
                                <SelectItem value="down">Down</SelectItem>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
