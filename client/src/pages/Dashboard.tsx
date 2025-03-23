import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircleIcon, XCircleIcon, PlayIcon, RotateCwIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['/api/dashboard'],
  });
  
  const { data: recentTests } = useQuery({
    queryKey: ['/api/tests/recent'],
  });

  const chartData = dashboardStats?.testsByDay || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Overview of your test automation metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? '...' : dashboardStats?.totalTests || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Across all test suites</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? '...' : `${dashboardStats?.successRate || 0}%`}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Executions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? '...' : dashboardStats?.executionsToday || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Test executions today</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Test Execution Trends</CardTitle>
              <CardDescription>Number of tests executed per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="passed" name="Passed" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="failed" name="Failed" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Test Executions</CardTitle>
              <CardDescription>Latest test runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTests?.map((test: any) => (
                  <div key={test.id} className="flex items-center border-b border-gray-100 pb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      test.status === 'passed' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {test.status === 'passed' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{test.name}</h4>
                      <div className="flex items-center text-xs text-gray-500">
                        <RotateCwIcon className="h-3 w-3 mr-1" />
                        <span>{new Date(test.executedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Link href={`/test-execution/${test.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}

                {(!recentTests || recentTests.length === 0) && (
                  <div className="text-center py-6 text-gray-500">
                    <p>No recent test executions</p>
                  </div>
                )}
                
                <div className="pt-3">
                  <Link href="/test-execution">
                    <Button className="w-full" variant="outline">
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Run Tests
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
