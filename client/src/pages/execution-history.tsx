import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TestExecution } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Eye, Filter, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

export default function ExecutionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: executions, isLoading, refetch } = useQuery<TestExecution[]>({
    queryKey: ["/api/test-executions"],
  });
  
  const filteredExecutions = executions?.filter(
    execution => execution.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Execution History</h1>
          <p className="text-slate-500 mt-1">View the history of all test executions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Executions</CardTitle>
              <CardDescription>
                A complete history of test executions
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search executions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <Skeleton className="h-5 w-64" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Executed At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExecutions?.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">{execution.testName}</TableCell>
                    <TableCell>{execution.browser}</TableCell>
                    <TableCell>
                      <StatusBadge status={execution.status as StatusType} />
                    </TableCell>
                    <TableCell>{execution.duration}</TableCell>
                    <TableCell>{(execution.executedAt || execution.lastRun)?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExecutions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No execution history found. Run some tests to see their results here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
