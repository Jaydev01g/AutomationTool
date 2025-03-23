// Common types used throughout the application

export interface TestSuite {
  id: number;
  name: string;
  testCount: number;
  createdAt: string;
}

export interface TestStep {
  id: number;
  type: string;
  order: number;
  selector?: string;
  text?: string;
  url?: string;
  condition?: string;
  duration?: number;
  direction?: string;
}

export interface Test {
  id: number;
  name: string;
  suiteId: number;
  steps: TestStep[];
  createdAt?: string;
  lastRun?: string;
  lastStatus?: string;
}

export interface TestAction {
  type: string;
  icon: React.ReactNode;
  label: string;
}

export interface SelectedElement {
  selector: string;
  type: string;
  tagName: string;
  attributes: Record<string, string>;
}

export interface TestStepResult {
  type: string;
  status: 'passed' | 'failed';
  selector?: string;
  url?: string;
  duration: number;
  error?: string;
}

export interface TestResult {
  id: number;
  testId: number;
  passed: number;
  failed: number;
  steps: TestStepResult[];
  duration: number;
  lastRun: string;
  error?: {
    stepIndex: number;
    action: string;
    message: string;
  };
}

export interface TestRun {
  id: number;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  totalTests: number;
  completedTests: number;
  passedTests: number;
  failedTests: number;
}
