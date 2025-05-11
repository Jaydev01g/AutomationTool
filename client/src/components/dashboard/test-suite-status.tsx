import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TestSuiteStatus } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { FilterIcon, Folder } from "lucide-react";

export function TestSuiteStatusComponent() {
  const { data: testSuites, isLoading } = useQuery<TestSuiteStatus[]>({
    queryKey: ["/api/test-suites/status"],
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg text-slate-800">Test Suite Status</h2>
          <div className="flex items-center space-x-2">
            <Button className="h-8 w-8">
              <FilterIcon className="h-4 w-4" />
            </Button>
            <Button className="text-sm">View All</Button>
          </div>
        </div>
        <div className="p-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="mb-6 last:mb-0">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-24 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-slate-800">Test Suite Status</h2>
        <div className="flex items-center space-x-2">
          <Button className="h-8 w-8">
            <FilterIcon className="h-4 w-4 text-slate-500" />
          </Button>
          <Button className="text-sm">View All</Button>
        </div>
      </div>
      <div className="p-6">
        {testSuites?.map((suite) => (
          <div key={suite.id} className="mb-6 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Folder className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium">{suite.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-slate-500 mr-2">Last run: {suite.lastRun}</span>
                <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`${suite.successRate >= 70 ? 'bg-success' : 'bg-error'} h-full`}
                    style={{ width: `${suite.successRate}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs font-medium">{suite.successRate}%</span>
              </div>
            </div>
            <div className="flex space-x-2">
              {suite.passed > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                  {suite.passed} passed
                </span>
              )}
              {suite.failed > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error/10 text-error">
                  {suite.failed} failed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
