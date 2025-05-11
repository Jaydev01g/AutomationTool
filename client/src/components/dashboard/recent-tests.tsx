import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TestExecution } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  Chrome,
  Globe,
  Monitor,
  MoreVertical,
  PlayCircle
} from "lucide-react";
import { useState } from "react";

const browserIcons: Record<string, React.ReactNode> = {
  Chrome: <Chrome className="h-4 w-4 mr-1" />,
  Firefox: <Globe className="h-4 w-4 mr-1" />,
  Safari: <Monitor className="h-4 w-4 mr-1" />,
};

export function RecentTests() {
  const { toast } = useToast();
  const [playingTest, setPlayingTest] = useState<number | null>(null);
  
  const { data: recentTests, isLoading } = useQuery<TestExecution[]>({
    queryKey: ["/api/test-executions/recent"],
  });
  
  const runTest = async (testId: number) => {
    setPlayingTest(testId);
    try {
      await apiRequest("POST", `/api/test-executions/run/${testId}`, {});
      toast({
        title: "Test started",
        description: "The test is now running",
      });
    } catch (error) {
      toast({
        title: "Failed to run test",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setPlayingTest(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg text-slate-800">Recent Test Executions</h2>
          <Button>View All</Button>
        </div>
        <div className="p-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg text-slate-800">Recent Test Executions</h2>
        <Button>View All</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Test Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Browser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Run</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {recentTests?.map((test) => (
              <tr key={test.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <PlayCircle className="text-primary mr-2 h-4 w-4" />
                    <span className="text-sm font-medium text-slate-800">{test.testName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={test.status as "passed" | "failed" | "warning" | "pending"} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <div className="flex items-center">
                    {browserIcons[test.browser] || <span className="material-icons text-sm mr-1">web</span>}
                    {test.browser}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {test.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {test.lastRun}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button 
                    onClick={() => runTest(test.id)}
                    disabled={playingTest === test.id}
                    className="h-8 w-8 mr-1"
                  >
                    <span className="material-icons text-sm">play_arrow</span>
                  </Button>
                  <Button className="h-8 w-8">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
