import { useState, useEffect } from "react";
import { CircleIcon, PauseIcon, PointerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPause: () => void;
  lastAction: string | null;
}

export default function RecordingModal({ isOpen, onClose, onPause, lastAction }: RecordingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recording in Progress</DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <FiberManualRecordIcon className="h-6 w-6 text-red-600 animate-pulse" />
            </div>
          </div>
          
          <p className="text-center text-gray-700 mb-4">
            TestFlow is recording your actions. Interact with your application as normal.
          </p>
          
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Last Action Recorded:</div>
            <div className="flex items-center space-x-2 text-gray-600">
              {lastAction ? (
                <>
                  <TouchIcon className="h-4 w-4" />
                  <span>{lastAction}</span>
                </>
              ) : (
                <span>No actions recorded yet</span>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-700"
              onClick={onPause}
            >
              Pause
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={onClose}
            >
              Stop Recording
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
