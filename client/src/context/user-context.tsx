import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
}

const defaultUser: User = {
  id: 1,
  name: "Alex Morgan",
  role: "QA Engineer"
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  
  return context;
}
