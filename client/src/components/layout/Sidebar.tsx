import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  FolderIcon, 
  SettingsIcon, 
  PlayCircleIcon, 
  PlusCircleIcon,
  LayoutDashboardIcon,
  ClipboardListIcon,
  BarChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestSuite } from "@/lib/types";

export default function Sidebar() {
  const [location] = useLocation();

  const { data: testSuites } = useQuery<TestSuite[]>({
    queryKey: ['/api/test-suites'],
  });

  return (
    <aside className="w-56 bg-gray-800 text-white flex flex-col flex-shrink-0">
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          <li className="px-3 py-2">
            <Link href="/">
              <div className={`flex items-center space-x-2 ${location === '/' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'} rounded-md px-2 py-1.5 cursor-pointer`}>
                <LayoutDashboardIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </Link>
          </li>
          <li className="px-3 py-2">
            <Link href="/test-builder">
              <div className={`flex items-center space-x-2 ${location === '/test-builder' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'} rounded-md px-2 py-1.5 cursor-pointer`}>
                <ClipboardListIcon className="h-4 w-4" />
                <span>Test Cases</span>
              </div>
            </Link>
          </li>
          <li className="px-3 py-2">
            <Link href="/test-execution">
              <div className={`flex items-center space-x-2 ${location === '/test-execution' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'} rounded-md px-2 py-1.5 cursor-pointer`}>
                <PlayCircleIcon className="h-4 w-4" />
                <span>Test Execution</span>
              </div>
            </Link>
          </li>
          <li className="px-3 py-2">
            <Link href="/reports">
              <div className={`flex items-center space-x-2 ${location === '/reports' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'} rounded-md px-2 py-1.5 cursor-pointer`}>
                <BarChartIcon className="h-4 w-4" />
                <span>Reports</span>
              </div>
            </Link>
          </li>
          <li className="px-3 py-2">
            <Link href="/settings">
              <div className={`flex items-center space-x-2 ${location === '/settings' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'} rounded-md px-2 py-1.5 cursor-pointer`}>
                <SettingsIcon className="h-4 w-4" />
                <span>Settings</span>
              </div>
            </Link>
          </li>
        </ul>
        
        <div className="mt-8 px-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Test Suites</h3>
          <ul className="mt-3">
            {testSuites?.map((suite) => (
              <li key={suite.id} className="flex items-center justify-between text-gray-300 hover:text-white hover:bg-gray-700 rounded-md px-2 py-1.5 cursor-pointer">
                <div className="flex items-center space-x-2">
                  <FolderIcon className="h-4 w-4" />
                  <span className="text-sm">{suite.name}</span>
                </div>
                <span className="text-xs bg-blue-600 px-1.5 py-0.5 rounded-full">{suite.testCount}</span>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-2 text-sm font-medium flex items-center justify-center space-x-1.5 transition"
          onClick={() => {
            fetch('/api/test-suites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'New Test Suite' }),
            })
              .then(res => res.json())
              .then(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/test-suites'] });
              });
          }}
        >
          <PlusCircleIcon className="h-4 w-4" />
          <span>New Test Suite</span>
        </Button>
      </div>
    </aside>
  );
}
