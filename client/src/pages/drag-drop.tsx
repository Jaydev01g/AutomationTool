import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

interface Action {
  type: string;
  selector?: string; // CSS selector or XPath
  value?: string; // For input actions
  url?: string; // For Navigate action
  status?: "success" | "failed" | "pending"; // Execution status
}

export default function DragDrop() {
  const [actions, setActions] = useState<Action[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionSelector, setActionSelector] = useState<string>(""); // For CSS selector or XPath
  const [actionValue, setActionValue] = useState<string>(""); // For input values

  const availableActions = ["Navigate", "Click", "Input", "Check", "Screenshot"];

  const handleAddAction = () => {
    if (selectedAction) {
      // Ensure "Navigate" is the first action
      if (selectedAction.toLowerCase() === "navigate" && actions.length > 0) {
        alert("Navigate must be the first action and cannot be added again.");
        return;
      }

      // Add the action with its details
      setActions((prev) => [
        ...prev,
        {
          type: selectedAction.toLowerCase(), // Convert action type to lowercase
          url: selectedAction.toLowerCase() === "navigate" ? actionSelector : undefined, // Use 'url' for Navigate
          selector: selectedAction.toLowerCase() !== "navigate" ? actionSelector : undefined,
          value: actionValue || undefined,
          status: "pending", // Default status
        },
      ]);

      // Reset the inputs
      setSelectedAction(null);
      setActionSelector("");
      setActionValue("");
    }
  };

  const handleRunScript = async () => {
    if (actions.length === 0) {
      alert("No actions to run.");
      return;
    }

    try {
      const response = await fetch("api/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ actions }),
      });

      const result = await response.json();
      if (result.success) {
        // Update the status of each action based on the result
        setActions((prev) =>
          prev.map((action, index) => ({
            ...action,
            status: result.results[index].success ? "success" : "failed",
          }))
        );
        alert("Script executed successfully.");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error executing script:", error);
      alert("An error occurred while executing the script.");
    }
  };

  const handleSaveSteps = async () => {
    if (actions.length === 0) {
      alert("No actions to save.");
      return;
    }

    try {
      const response = await fetch("api/save-steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ actions }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Steps saved successfully.");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving steps:", error);
      alert("An error occurred while saving the steps.");
    }
  };

  const handleLoadSteps = async () => {
    try {
      const response = await fetch("api/load-steps", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setActions(result.actions); // Load saved actions into the state
        alert("Steps loaded successfully.");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error loading steps:", error);
      alert("An error occurred while loading the steps.");
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedActions = Array.from(actions);
    const [removed] = reorderedActions.splice(result.source.index, 1);
    reorderedActions.splice(result.destination.index, 0, removed);

    setActions(reorderedActions);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Drag & Drop Automation</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Available Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Available Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {availableActions.map((action, index) => (
                <li
                  key={index}
                  className={`p-2 border rounded cursor-pointer ${
                    selectedAction === action ? "bg-indigo-100 border-indigo-500" : ""
                  }`}
                  onClick={() => setSelectedAction(action)}
                >
                  {action}
                </li>
              ))}
            </ul>
            {selectedAction && (
              <>
                {selectedAction === "Navigate" && (
                  <input
                    type="text"
                    placeholder="Enter URL"
                    value={actionSelector}
                    onChange={(e) => setActionSelector(e.target.value)}
                    className="mt-2 p-2 border rounded w-full"
                  />
                )}
                {selectedAction !== "Navigate" && (
                  <>
                    <input
                      type="text"
                      placeholder="Enter Selector (e.g., #button or //input[@id='username'])"
                      value={actionSelector}
                      onChange={(e) => setActionSelector(e.target.value)}
                      className="mt-2 p-2 border rounded w-full"
                    />
                    {selectedAction === "Input" && (
                      <input
                        type="text"
                        placeholder="Enter Input Value"
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                        className="mt-2 p-2 border rounded w-full"
                      />
                    )}
                  </>
                )}
              </>
            )}
            <Button
              className="mt-4"
              onClick={handleAddAction}
              disabled={!selectedAction || (selectedAction !== "Navigate" && !actionSelector)}
            >
              Add Action
            </Button>
          </CardContent>
        </Card>

        {/* Canvas for Selected Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="actions">
                {(provided) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {actions.map((action, index) => (
                      <Draggable key={index} draggableId={action.type + index} index={index}>
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2 border rounded ${
                              action.status === "success"
                                ? "bg-green-100 border-green-500"
                                : action.status === "failed"
                                ? "bg-red-100 border-red-500"
                                : ""
                            }`}
                          >
                            {index + 1}. {action.type}{" "}
                            {action.selector && `(${action.selector})`}{" "}
                            {action.value && `= ${action.value}`}{" "}
                            {action.status && `- ${action.status}`}
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
            <Button
              className="mt-4"
              onClick={handleRunScript}
              disabled={!actions.length}
            >
              Run Script
            </Button>
            <Button
              className="mt-4"
              onClick={handleSaveSteps}
              disabled={!actions.length}
            >
              Save Steps
            </Button>
            <Button
              className="mt-4"
              onClick={handleLoadSteps}
            >
              Load Saved Steps
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}