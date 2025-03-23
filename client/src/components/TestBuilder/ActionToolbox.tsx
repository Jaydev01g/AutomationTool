import { MousePointerIcon, TouchIcon, KeyboardIcon, CheckCircleIcon, TimerIcon, ChevronUpDownIcon } from "lucide-react";
import { useState } from "react";
import { TestAction } from "@/lib/types";

interface ActionToolboxProps {
  onActionSelected: (action: TestAction) => void;
}

export default function ActionToolbox({ onActionSelected }: ActionToolboxProps) {
  const actionItems: TestAction[] = [
    { type: 'navigate', icon: <MousePointerIcon className="h-4 w-4 text-gray-500" />, label: 'Navigate' },
    { type: 'click', icon: <TouchIcon className="h-4 w-4 text-gray-500" />, label: 'Click' },
    { type: 'type', icon: <KeyboardIcon className="h-4 w-4 text-gray-500" />, label: 'Type Text' },
    { type: 'verify', icon: <CheckCircleIcon className="h-4 w-4 text-gray-500" />, label: 'Verify Element' },
    { type: 'wait', icon: <TimerIcon className="h-4 w-4 text-gray-500" />, label: 'Wait' },
    { type: 'scroll', icon: <ChevronUpDownIcon className="h-4 w-4 text-gray-500" />, label: 'Scroll' },
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, action: TestAction) => {
    e.dataTransfer.setData('application/json', JSON.stringify(action));
    e.currentTarget.classList.add('bg-gray-200');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-gray-200');
  };

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 mb-6">
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <h3 className="font-medium text-gray-800">Available Actions</h3>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">Drag and drop actions to build your test</p>
        <div className="space-y-2">
          {actionItems.map((action) => (
            <div
              key={action.type}
              className="bg-gray-50 p-3 border border-gray-200 rounded drag-item cursor-pointer hover:bg-gray-100 flex items-center space-x-2"
              draggable="true"
              data-action-type={action.type}
              onDragStart={(e) => handleDragStart(e, action)}
              onDragEnd={handleDragEnd}
              onClick={() => onActionSelected(action)}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
