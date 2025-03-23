import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/user-context";
import NotFound from "@/pages/not-found";
import TestRecorder from "@/pages/test-recorder";

// Import with capitalized versions to prevent typescript errors
import Dashboard from "@/pages/Dashboard";
import TestCases from "@/pages/test-cases";
import TestSuites from "@/pages/test-suites";
import Reports from "@/pages/Reports";
import ExecutionHistory from "@/pages/execution-history";
import Settings from "@/pages/Settings";
import MainLayout from "@/components/layout/main-layout";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Switch>
          {/* Test Recorder is rendered outside of MainLayout */}
          <Route path="/recorder">
            <TestRecorder />
          </Route>
          
          {/* All other routes use the MainLayout */}
          <Route>
            <MainLayout>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/test-cases" component={TestCases} />
                <Route path="/test-suites" component={TestSuites} />
                <Route path="/reports" component={Reports} />
                <Route path="/history" component={ExecutionHistory} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </MainLayout>
          </Route>
        </Switch>
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
