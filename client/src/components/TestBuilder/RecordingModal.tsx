import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CodeIcon, TouchpadIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPause: () => void;
  lastAction: string | null;
}

export default function RecordingModal({ isOpen, onClose, onPause, lastAction }: RecordingModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Timer for recording duration
  useEffect(() => {
    if (isOpen && !isPaused) {
      const timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
      return () => clearInterval(timer);
    } else if (!isOpen) {
      setElapsedTime(0);
    }
  }, [isOpen, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePause = () => {
    setIsPaused((prev) => !prev);
    onPause();
  };

  const handleStopRecording = () => {
    if (window.confirm("Are you sure you want to stop the recording?")) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()} aria-labelledby="recording-modal-title">
      <DialogContent className="sm:max-w-md" role="dialog" aria-modal="true">
        <DialogHeader>
          <DialogTitle id="recording-modal-title">Recording in Progress</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Recording Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <CodeIcon className="h-6 w-6 text-red-600 animate-pulse" />
            </div>
          </div>

          {/* Recording Duration */}
          <p className="text-center text-gray-500 mb-4">
            Recording Duration: {formatTime(elapsedTime)}
          </p>

          {/* Last Action Recorded */}
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Last Action Recorded:</div>
            <div className="flex items-center space-x-2 text-gray-600">
              {lastAction ? (
                <>
                  <TouchpadIcon className="h-4 w-4" />
                  <span>{lastAction}</span>
                </>
              ) : (
                <span className="italic text-gray-500">No actions recorded yet. Start interacting with your application.</span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-end space-x-2">
            <Button
              className={`${
                isPaused ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-200 hover:bg-gray-300"
              } text-gray-700`}
              onClick={handlePause}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleStopRecording}
            >
              Stop Recording
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}