import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/user-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import TestRecorder from "@/pages/test-recorder";
import TestCases from "@/pages/test-cases";
import TestSuites from "@/pages/test-suites";
import Reports from "@/pages/reports";
import ExecutionHistory from "@/pages/execution-history";
import Settings from "@/pages/settings";
import MainLayout from "@/components/layout/main-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/recorder" component={TestRecorder} />
      <Route path="/test-cases" component={TestCases} />
      <Route path="/test-suites" component={TestSuites} />
      <Route path="/reports" component={Reports} />
      <Route path="/history" component={ExecutionHistory} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
