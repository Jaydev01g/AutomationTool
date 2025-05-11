import { Input } from "@/components/ui/input";
import { TestAction } from "@/lib/types";
import {
  CheckCircleIcon,
  ChevronsUpDownIcon,
  KeyboardIcon,
  MousePointerIcon,
  TimerIcon,
  TouchpadIcon,
} from "lucide-react";
import { useState } from "react";

interface ActionToolboxProps {
  onActionSelected: (action: TestAction) => void;
}

export default function ActionToolbox({ onActionSelected }: ActionToolboxProps) {
  const [search, setSearch] = useState("");

  const actionItems: TestAction[] = [
    { type: "navigate", icon: <MousePointerIcon className="h-4 w-4 text-gray-500" />, label: "Navigate" },
    { type: "click", icon: <TouchpadIcon className="h-4 w-4 text-gray-500" />, label: "Click" },
    { type: "type", icon: <KeyboardIcon className="h-4 w-4 text-gray-500" />, label: "Type Text" },
    { type: "verify", icon: <CheckCircleIcon className="h-4 w-4 text-gray-500" />, label: "Verify Element" },
    { type: "wait", icon: <TimerIcon className="h-4 w-4 text-gray-500" />, label: "Wait" },
    { type: "scroll", icon: <ChevronsUpDownIcon className="h-4 w-4 text-gray-500" />, label: "Scroll" },
  ];

  // Filter actions based on the search input
  const filteredActions = actionItems.filter((action) =>
    action.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, action: TestAction) => {
    e.dataTransfer.setData("application/json", JSON.stringify(action));
    e.currentTarget.classList.add("bg-gray-200", "ring-2", "ring-blue-500");
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("bg-gray-200", "ring-2", "ring-blue-500");
  };

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 mb-6">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <h3 className="font-medium text-gray-800">Available Actions</h3>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <Input
          type="text"
          placeholder="Search actions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        <p className="text-sm text-gray-600 mb-3">Drag and drop actions to build your test</p>

        {/* Action Items */}
        <div className="space-y-2">
          {filteredActions.length === 0 ? (
            <p className="text-sm text-gray-500">No actions found</p>
          ) : (
            filteredActions.map((action) => (
              <div
                key={action.type}
                className="bg-gray-50 p-3 border border-gray-200 rounded drag-item cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
                draggable="true"
                data-action-type={action.type}
                onDragStart={(e) => handleDragStart(e, action)}
                onDragEnd={handleDragEnd}
                onClick={() => onActionSelected(action)}
                tabIndex={0} // Make the element focusable
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onActionSelected(action);
                  }
                }}
                title={`Perform the "${action.label}" action`} // Tooltip
              >
                {action.icon}
                <span className="text-sm font-medium">{action.label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}