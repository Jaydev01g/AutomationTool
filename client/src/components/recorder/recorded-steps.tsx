import { ScrollArea } from "@/components/ui/scroll-area";
import { Video } from "lucide-react";

interface RecordedStepsProps {
  steps: string[];
  height?: string;
}

export function RecordedSteps({ steps, height = "h-48" }: RecordedStepsProps) {
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
    <ScrollArea className={`p-3 bg-white ${height}`}>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div 
            key={index}
            className="text-sm border border-slate-200 rounded p-2 bg-slate-50"
          >
            <div className="flex items-center">
              <span className="font-semibold text-xs bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mr-2">
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
