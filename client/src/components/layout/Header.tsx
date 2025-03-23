import { Link } from "wouter";
import { BellIcon, PlusIcon, SpeedIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center px-4 py-2">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <SpeedIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-gray-800">TestFlow</h1>
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/test-builder">
            <Button className="bg-primary text-white px-3 py-1.5 rounded-md flex items-center space-x-1 hover:bg-blue-600 transition">
              <PlusIcon className="h-4 w-4" />
              <span>New Test</span>
            </Button>
          </Link>
          <div className="relative">
            <BellIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">JS</div>
            <span className="text-sm text-gray-700">John Smith</span>
          </div>
        </div>
      </div>
    </header>
  );
}
