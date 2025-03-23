import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/user-context";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

export function UserAvatar({ size = "md", showStatus = false }: UserAvatarProps) {
  const { user } = useUser();
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };
  
  const getFallbackText = (name: string) => {
    return name.split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };
  
  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback>{getFallbackText(user.name)}</AvatarFallback>
      </Avatar>
      
      {showStatus && (
        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
      )}
    </div>
  );
}
