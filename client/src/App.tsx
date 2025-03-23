import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/user-context";
import NotFound from "@/pages/not-found";
import TestRecorder from "@/pages/test-recorder";
import LandingPage from "@/pages/landing-page";
import ProjectDashboard from "@/pages/project-dashboard";

// Import with consistent casing to prevent typescript errors
import Dashboard from "@/pages/dashboard";
import TestCases from "@/pages/test-cases";
import TestSuites from "@/pages/test-suites";
import Reports from "@/pages/reports";
import ExecutionHistory from "@/pages/execution-history";
import Settings from "@/pages/settings";
import MainLayout from "@/components/layout/main-layout";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Switch>
          {/* Landing page */}
          <Route path="/" component={LandingPage} />
          
          {/* Project Dashboard */}
          <Route path="/projects" component={ProjectDashboard} />
          
          {/* Test Recorder is rendered outside of MainLayout */}
          <Route path="/recorder">
            <TestRecorder />
          </Route>
          
          {/* Add an alias for the recorder at /test-recorder */}
          <Route path="/test-recorder">
            <TestRecorder />
          </Route>
          
          {/* Legacy app routes use the MainLayout */}
          <Route path="/app">
            <MainLayout>
              <Switch>
                <Route path="/app" component={Dashboard} />
                <Route path="/app/test-cases" component={TestCases} />
                <Route path="/app/test-suites" component={TestSuites} />
                <Route path="/app/reports" component={Reports} />
                <Route path="/app/history" component={ExecutionHistory} />
                <Route path="/app/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </MainLayout>
          </Route>
          
          {/* Catch all for not found routes */}
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
