import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, MoreHorizontal, Play, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

// Ensure the LocalTest type includes the 'steps' property with the correct type
type LocalTest = {
  id: string;
  name: string;
  browser: string;
  lastRun?: string;
  lastStatus?: string;
  steps: { id: string; description: string }[]; // Adjust the type as per your schema
};

export default function TestCases() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tests, isLoading, isError } = useQuery<LocalTest[]>({
    queryKey: ["/api/tests"],
    queryFn: async () => {
      const response = await fetch("/api/tests");
      if (!response.ok) {
        throw new Error("Failed to fetch test cases");
      }
      return response.json();
    },
  });

  const filteredTests = tests?.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Test Cases</h1>
          <p className="text-slate-500 mt-1">Manage your automated test cases</p>
        </div>
        <Link href="/recorder">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            Create Test
          </Button>
        </Link>
      </div>

      {/* Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Test Cases</CardTitle>
              <CardDescription>
                A list of all your automated test cases
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search test cases..."
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
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <Skeleton className="h-5 w-64" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Failed to load test cases. Please try again later.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests?.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell>{test.browser}</TableCell>
                    <TableCell>{test.lastRun || "Never"}</TableCell>
                    <TableCell>
                      <StatusBadge status={(test.lastStatus as StatusType) || "pending"} />
                    </TableCell>
                    <TableCell>{test.steps.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Run Test"
                          aria-label="Run Test"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Test"
                          aria-label="Edit Test"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Details"
                          aria-label="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>Export</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTests?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No test cases found. Create your first test case to get started.
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