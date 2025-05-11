import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useUser } from "@/context/user-context";
import { Bell, HelpCircle, LogOut, Menu, Settings, User } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const user = useUser();
  const [hasNotifications] = useState(true);
  
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center md:hidden">
        <Button onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-3">AutoTest</h1>
      </div>
      <div className="hidden md:block">
        <Button className="bg-primary/5 text-primary hover:bg-primary/10">
          <HelpCircle className="h-4 w-4 mr-1" />
          <span>Help</span>
        </Button>
      </div>
      <div className="flex items-center space-x-3">
        <Button className="relative">
          <Bell className="h-5 w-5 text-slate-500" />
          {hasNotifications && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error"></span>
          )}
        </Button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center focus:outline-none px-1">
              <span className="text-sm font-medium mr-2 hidden md:block">{user?.displayName || "Guest"}</span>
              <UserAvatar size="sm" />
              <span className="material-icons text-sm ml-1">arrow_drop_down</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
