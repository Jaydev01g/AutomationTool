import { CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react";
import { TestResult } from "@/lib/types";

interface TestResultsProps {
  testResults: TestResult | null;
}

export default function TestResults({ testResults }: TestResultsProps) {
  if (!testResults) {
    return null;
  }

  const { passed, failed, steps, duration, lastRun, error } = testResults;

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 mt-6 overflow-hidden">
      <div className="border-b border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
        <h3 className="font-medium text-gray-800">Test Execution Results</h3>
        <div className="flex items-center space-x-2">
          <div className="text-xs bg-gray-200 px-2 py-1 rounded-full">
            Last Run: {lastRun ? new Date(lastRun).toLocaleString() : 'Never'}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex space-x-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-green-800 font-medium">Passed</div>
              <div className="text-2xl font-bold text-green-600">{passed}</div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-red-800 font-medium">Failed</div>
              <div className="text-2xl font-bold text-red-600">{failed}</div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <ClockIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-800 font-medium">Duration</div>
              <div className="text-2xl font-bold text-gray-600">{(duration / 1000).toFixed(1)}s</div>
            </div>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Element/Details</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {steps.map((step, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{step.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {step.type === 'navigate' ? step.url : step.selector}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      step.status === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {step.status === 'passed' ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(step.duration / 1000).toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {error && (
          <div className="mt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <h4 className="font-medium text-red-800">
                    Error in Step {error.stepIndex + 1}: {error.action}
                  </h4>
                  <p className="text-sm text-red-600 mt-1">{error.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
