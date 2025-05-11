import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, Trash2, Video } from "lucide-react";
import { useState } from "react";

interface RecordedStepsProps {
  steps: string[];
  height?: string;
  onDeleteStep?: (index: number) => void;
  onEditStep?: (index: number) => void;
}

export function RecordedSteps({
  steps,
  height = "h-48",
  onDeleteStep,
  onEditStep,
}: RecordedStepsProps) {
  const [filter, setFilter] = useState("");

  // Filter steps based on the search input
  const filteredSteps = steps.filter((step) =>
    step.toLowerCase().includes(filter.toLowerCase())
  );

  // Export steps as a JSON file
  const handleExportSteps = () => {
    const dataStr = JSON.stringify(steps, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "recorded-steps.json");
    linkElement.click();
  };

  if (steps.length === 0) {
    return (
      <div className={`p-3 bg-white ${height} overflow-y-auto`}>
        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
          <div className="text-center">
            <Video className="w-10 h-10 mx-auto mb-2" />
            <p>No steps recorded yet.</p>
            <p>Click "Record" to begin capturing test steps.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <Input
        type="text"
        placeholder="Search steps..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-3"
      />

      {/* Export button */}
      <Button
        className="mb-3 text-xs text-blue-500 hover:underline"
        onClick={handleExportSteps}
      >
        <Download className="h-4 w-4 mr-1" />
        Export Steps
      </Button>

      {/* Scrollable area for steps */}
      <ScrollArea className={`p-3 bg-white ${height}`}>
        <div className="space-y-2">
          {filteredSteps.map((step, index) => (
            <div
              key={index}
              className={`text-sm border border-slate-200 rounded p-2 ${
                index === steps.length - 1 ? "bg-green-50" : "bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-semibold text-xs bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mr-2">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
                <div className="flex space-x-2">
                  {/* Copy to clipboard button */}
                  <button
                    className="text-xs text-blue-500 hover:underline"
                    onClick={() => navigator.clipboard.writeText(step)}
                  >
                    <Copy className="h-4 w-4 inline-block mr-1" />
                    Copy
                  </button>

                  {/* Edit button */}
                  {onEditStep && (
                    <button
                      className="text-xs text-blue-500 hover:underline"
                      onClick={() => onEditStep(index)}
                    >
                      Edit
                    </button>
                  )}

                  {/* Delete button */}
                  {onDeleteStep && (
                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => onDeleteStep(index)}
                    >
                      <Trash2 className="h-4 w-4 inline-block mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}