import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectedElement } from "@/lib/types";

interface ElementInspectorProps {
  selectedElement: SelectedElement | null;
  onSelectElement: () => void;
}

export default function ElementInspector({ selectedElement, onSelectElement }: ElementInspectorProps) {
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <h3 className="font-medium text-gray-800">Element Inspector</h3>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">Click "Select Element" to choose an element from the page</p>
        <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
          <div className="text-sm font-medium text-gray-700 mb-2">Selected Element</div>
          <div className="bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm font-mono mb-3">
            {selectedElement?.selector || 'No element selected'}
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Element Type</label>
              <div className="text-sm text-gray-800">
                {selectedElement?.type || '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Available Actions</label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-gray-200 text-gray-700 px-2 py-1 text-xs"
                  disabled={!selectedElement}
                >
                  Click
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-gray-200 text-gray-700 px-2 py-1 text-xs"
                  disabled={!selectedElement || (selectedElement?.type !== 'input' && selectedElement?.type !== 'textarea')}
                >
                  Type
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-gray-200 text-gray-700 px-2 py-1 text-xs"
                  disabled={!selectedElement}
                >
                  Verify
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
