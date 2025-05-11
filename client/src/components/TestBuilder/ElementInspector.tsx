import { Button } from "@/components/ui/button";
import { SelectedElement } from "@/lib/types";
import { useEffect } from "react";

interface ElementInspectorProps {
  selectedElement: SelectedElement | null;
  onSelectElement: (element: SelectedElement | null) => void;
}

export default function ElementInspector({ selectedElement, onSelectElement }: ElementInspectorProps) {
  // Highlight the selected element on the page
  useEffect(() => {
    if (selectedElement?.selector) {
      const element = document.querySelector(selectedElement.selector);
      if (element) {
        element.classList.add("highlighted-element");
      }
      return () => {
        if (element) {
          element.classList.remove("highlighted-element");
        }
      };
    }
  }, [selectedElement]);

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <h3 className="font-medium text-gray-800">Element Inspector</h3>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">
          Click "Select Element" to choose an element from the page
        </p>

        {/* Selected Element Details */}
        <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
          <div className="text-sm font-medium text-gray-700 mb-2">Selected Element</div>
          <div className="bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm font-mono mb-3">
            {selectedElement?.selector || (
              <span className="text-gray-500">No element selected. Click "Select Element" to choose one.</span>
            )}
          </div>

          {/* Element Type */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Element Type</label>
              <div className="text-sm text-gray-800">
                {selectedElement?.type || "-"}
              </div>
            </div>

            {/* Available Actions */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Available Actions</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-gray-200 text-gray-700 px-2 py-1 text-xs"
                  disabled={!selectedElement}
                  title="Simulate a click action on the selected element"
                >
                  Click
                </Button>
                <Button
                  className="bg-gray-200 text-gray-700 px-2 py-1 text-xs"
                  disabled={!selectedElement || (selectedElement?.type !== "input" && selectedElement?.type !== "textarea")}
                  title="Type text into the selected element"
                >
                  Type
                </Button>
                <Button
                  className="bg-gray-200 text-gray-700 px-2 py-1 text-xs"
                  disabled={!selectedElement}
                  title="Verify the selected element"
                >
                  Verify
                </Button>
                <Button
                  className="bg-gray-200 text-gray-700 px-2 py-1 text-xs"
                  onClick={() => navigator.clipboard.writeText(selectedElement?.selector || "")}
                  disabled={!selectedElement}
                  title="Copy the CSS selector of the selected element"
                >
                  Copy Selector
                </Button>
              </div>
            </div>

            {/* Reset Button */}
            <div>
              <Button
                className="bg-red-200 text-red-700 px-2 py-1 text-xs"
                onClick={() => onSelectElement(null)}
                title="Clear the selected element and reset the inspector"
              >
                Reset Selection
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Highlighted Element CSS */}
      <style>
        {`
          .highlighted-element {
            outline: 2px solid blue;
            outline-offset: 2px;
          }
        `}
      </style>
    </div>
  );
}