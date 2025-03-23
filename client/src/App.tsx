import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import TestBuilder from "@/pages/TestBuilder";
import TestExecution from "@/pages/TestExecution";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/test-builder" component={TestBuilder} />
      <Route path="/test-execution" component={TestExecution} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-100">
          <Router />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
