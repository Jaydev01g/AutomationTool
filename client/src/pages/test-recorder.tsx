import { BrowserRecorder } from "@/components/recorder/browser-recorder";

export default function TestRecorder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Test Recorder</h1>
        <p className="text-slate-500 mt-1">Record browser interactions and create automated tests</p>
      </div>
      
      <BrowserRecorder />
    </div>
  );
}
