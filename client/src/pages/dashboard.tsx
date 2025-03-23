import { Button } from "@/components/ui/button";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { RecentTests } from "@/components/dashboard/recent-tests";
import { TestSuiteStatusComponent } from "@/components/dashboard/test-suite-status";
import { RecordingTool } from "@/components/dashboard/recording-tool";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function Dashboard() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <Input 
              type="text" 
              placeholder="Search tests..." 
              className="pl-10 pr-4 w-64"
            />
          </div>
          <Link href="/recorder">
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              New Test
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <MetricsGrid />

      {/* Recent Tests & Recording Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tests Column */}
        <div className="lg:col-span-2">
          <RecentTests />
          <TestSuiteStatusComponent />
        </div>

        {/* Recording Tool Column */}
        <div>
          <RecordingTool />
        </div>
      </div>
    </div>
  );
}
