import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UserContextType {
  user: {
    avatarUrl: string | undefined; name: string; role: string; 
};
  displayName: string;
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const defaultUser: User = {
  id: 1,
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  role: "QA Engineer"
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('nextgen_user');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setAuthState({
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would be an API call
    // For demonstration, we'll use a mock login
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (email && password) {
        const user = {
          ...defaultUser,
          email
        };
        
        localStorage.setItem('nextgen_user', JSON.stringify(user));
        
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('nextgen_user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    // In a real app, this would be an API call
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (userData.email && userData.password) {
        const newUser: User = {
          id: Math.floor(Math.random() * 10000),
          name: userData.name || "New User",
          email: userData.email,
          role: "QA Engineer"
        };
        
        localStorage.setItem('nextgen_user', JSON.stringify(newUser));
        
        setAuthState({
          user: newUser,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...userData };
      localStorage.setItem('nextgen_user', JSON.stringify(updatedUser));
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
    }
  };

  return (
    <UserContext.Provider 
      value={{ 
        user: authState.user 
          ? { name: authState.user.name, role: authState.user.role, avatarUrl: authState.user.avatarUrl } 
          : { name: "Guest", role: "Guest", avatarUrl: undefined },
        displayName: authState.user?.name || "Guest",
        authState, 
        login, 
        logout, 
        register,
        updateUser
      }}
    >
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
