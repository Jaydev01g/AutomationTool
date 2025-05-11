import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Calendar, Download, Filter, LineChart, Search } from "lucide-react";

interface ReportSummary {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  failRate: number;
  avgDuration: string;
}

export default function Reports() {
  const { data: reportSummary, isLoading } = useQuery<ReportSummary>({
    queryKey: ["/api/reports/summary"],
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-500 mt-1">View and analyze test execution results</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{reportSummary?.totalTests || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Passed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{reportSummary?.passed || 0}</p>
                <p className="text-xs text-slate-400">{reportSummary?.passRate || 0}% pass rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-error">{reportSummary?.failed || 0}</p>
                <p className="text-xs text-slate-400">{reportSummary?.failRate || 0}% fail rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Avg. Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{reportSummary?.avgDuration || "0s"}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Report Tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Test Reports</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search reports..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="list">
                List View
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <LineChart className="mr-1 h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="summary">
                <BarChart className="mr-1 h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <div className="rounded-md border">
                <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
                  <div className="font-medium">Recent Test Executions</div>
                  <div className="text-sm text-slate-500">Showing last 30 days</div>
                </div>
                <div className="divide-y">
                  {isLoading ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-4">
                          <div className="space-y-1">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-4 text-center text-slate-500">
                      Run your tests to see execution reports here.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="timeline">
              <div className="rounded-md border p-6 h-80 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <BarChart className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <h3 className="font-medium mb-1">No timeline data yet</h3>
                  <p>Execute more tests to see timeline reports</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="summary">
              <div className="rounded-md border p-6 h-80 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <LineChart className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <h3 className="font-medium mb-1">No summary data yet</h3>
                  <p>Execute more tests to see summary reports</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
