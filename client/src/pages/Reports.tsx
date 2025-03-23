import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Reports() {
  const { data: reportStats, isLoading } = useQuery({
    queryKey: ['/api/reports/summary'],
  });
  
  const { data: testExecutions } = useQuery({
    queryKey: ['/api/test-runs/recent'],
  });

  const { data: testSuites } = useQuery({
    queryKey: ['/api/test-suites'],
  });

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6366F1'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600">Analytics and insights from your test executions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? '...' : reportStats?.totalRuns || 0}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overall Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? '...' : `${reportStats?.successRate || 0}%`}
            </div>
            <p className="text-xs text-gray-500 mt-1">Passed tests / Total tests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? '...' : `${reportStats?.avgDuration || 0}s`}</div>
            <p className="text-xs text-gray-500 mt-1">Average test execution time</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Test Execution History</CardTitle>
            <CardDescription>Success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportStats?.trendData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="successRate" stroke="#10B981" name="Success Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results Distribution</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Passed', value: reportStats?.passed || 0 },
                      { name: 'Failed', value: reportStats?.failed || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Passed', value: reportStats?.passed || 0 },
                      { name: 'Failed', value: reportStats?.failed || 0 },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Test Executions</CardTitle>
          <div className="flex space-x-2">
            <div className="w-[180px]">
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Filter by suite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suites</SelectItem>
                  {testSuites?.map((suite: any) => (
                    <SelectItem key={suite.id} value={suite.id.toString()}>
                      {suite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Suite
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pass Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testExecutions?.map((run: any) => (
                  <tr key={run.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{run.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {run.suiteName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(run.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.duration}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="mr-2">{run.passRate}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${run.passRate >= 80 ? 'bg-green-500' : run.passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${run.passRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        run.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        run.status === 'running' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link href={`/reports/${run.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                
                {(!testExecutions || testExecutions.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      No test executions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Showing 1-{testExecutions?.length || 0} of {testExecutions?.length || 0} executions
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
