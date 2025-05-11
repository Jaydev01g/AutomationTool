import { UserAvatar } from "@/components/ui/user-avatar";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

interface SidebarItemProps {
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, href, isActive }: SidebarItemProps) => {
  return (
    <li className="mb-1">
      <Link href={href}>
        <a className={cn(
          "flex items-center px-4 py-3 rounded-lg mx-2",
          isActive 
            ? "bg-slate-700 text-white" 
            : "text-slate-300 hover:bg-slate-700 hover:text-white"
        )}>
          <span className="material-icons mr-3">{icon}</span>
          {label}
        </a>
      </Link>
    </li>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const userContext = useUser();
  const user = userContext?.user || { name: "Guest", role: "Viewer" }; // Provide fallback if necessary
  
  const navItems = [
    { icon: "dashboard", label: "Dashboard", href: "/" },
    { icon: "play_circle", label: "Test Recorder", href: "/recorder" },
    { icon: "library_books", label: "Test Cases", href: "/test-cases" },
    { icon: "integration_instructions", label: "Test Suites", href: "/test-suites" },
    { icon: "assessment", label: "Reports", href: "/reports" },
    { icon: "history", label: "Execution History", href: "/history" },
    { icon: "settings", label: "Settings", href: "/settings" },
  ];
  
  return (
    <div className="bg-slate-800 text-white w-64 flex-shrink-0 hidden md:flex md:flex-col">
      <div className="flex items-center justify-center h-16 border-b border-slate-700">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="material-icons mr-2">speed</span>
          AutoTest
        </h1>
      </div>
      <div className="py-4 flex-1 overflow-y-auto">
        <ul>
          {navItems.map((item) => (
            <SidebarItem 
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={location === item.href}
            />
          ))}
        </ul>
      </div>
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center">
          <UserAvatar />
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
