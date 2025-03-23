import { 
  TestSuite, InsertTestSuite, 
  Test, InsertTest, 
  TestStep, InsertTestStep,
  TestRun, InsertTestRun,
  TestResult, InsertTestResult,
  Setting, InsertSetting
} from "@shared/schema";

// Storage interface for CRUD operations
export interface IStorage {
  // Test Suites
  getTestSuites(): Promise<TestSuite[]>;
  getTestSuite(id: number): Promise<TestSuite | undefined>;
  createTestSuite(data: InsertTestSuite): Promise<TestSuite>;
  updateTestSuite(id: number, data: Partial<TestSuite>): Promise<TestSuite | undefined>;
  deleteTestSuite(id: number): Promise<void>;

  // Tests
  getTests(): Promise<Test[]>;
  getTest(id: number): Promise<Test | undefined>;
  getTestsBySuite(suiteId: number): Promise<Test[]>;
  createTest(data: InsertTest): Promise<Test>;
  updateTest(id: number, data: Partial<Test>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<void>;
  getRecentTests(limit: number): Promise<any[]>;

  // Test Steps
  getTestSteps(testId: number): Promise<TestStep[]>;
  getTestStep(id: number): Promise<TestStep | undefined>;
  createTestStep(data: InsertTestStep): Promise<TestStep>;
  updateTestStep(id: number, data: Partial<TestStep>): Promise<TestStep | undefined>;
  deleteTestStep(id: number): Promise<void>;
  deleteAllTestSteps(testId: number): Promise<void>;
  reorderTestSteps(steps: { id: number, order: number }[]): Promise<void>;

  // Test Runs
  getTestRun(id: number): Promise<TestRun | undefined>;
  createTestRun(data: InsertTestRun): Promise<TestRun>;
  updateTestRun(id: number, data: Partial<TestRun>): Promise<TestRun | undefined>;
  getRecentTestRuns(limit: number): Promise<any[]>;

  // Test Results
  getTestResult(id: number): Promise<TestResult | undefined>;
  getTestResultsByRun(runId: number): Promise<TestResult[]>;
  createTestResult(data: InsertTestResult): Promise<TestResult>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  createOrUpdateSetting(key: string, value: any): Promise<Setting>;

  // Dashboard & Reports
  getTotalTests(): Promise<number>;
  getSuccessRate(): Promise<number>;
  getExecutionsCountToday(): Promise<number>;
  getTestRunsByDay(): Promise<any[]>;
  getTotalTestRuns(): Promise<number>;
  getTotalPassedTests(): Promise<number>;
  getTotalFailedTests(): Promise<number>;
  getAverageTestDuration(): Promise<number>;
  getSuccessRateTrend(): Promise<any[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private testSuites: Map<number, TestSuite>;
  private tests: Map<number, Test>;
  private testSteps: Map<number, TestStep>;
  private testRuns: Map<number, TestRun>;
  private testResults: Map<number, TestResult>;
  private settings: Map<string, Setting>;

  private testSuiteId: number = 1;
  private testId: number = 1;
  private testStepId: number = 1;
  private testRunId: number = 1;
  private testResultId: number = 1;
  private settingId: number = 1;

  constructor() {
    this.testSuites = new Map();
    this.tests = new Map();
    this.testSteps = new Map();
    this.testRuns = new Map();
    this.testResults = new Map();
    this.settings = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample test suites
    const loginSuite = this.createTestSuiteInternal({ name: "Login Tests" });
    const checkoutSuite = this.createTestSuiteInternal({ name: "Checkout Flow" });
    const profileSuite = this.createTestSuiteInternal({ name: "User Profile" });

    // Create sample tests
    const loginTest = this.createTestInternal({ 
      name: "Login Process Test", 
      suiteId: loginSuite.id 
    });

    // Add sample steps to the login test
    this.createTestStepInternal({
      testId: loginTest.id,
      type: 'navigate',
      order: 0,
      url: 'https://example.com'
    });

    this.createTestStepInternal({
      testId: loginTest.id,
      type: 'click',
      order: 1,
      selector: '#login-form input[name="username"]'
    });

    this.createTestStepInternal({
      testId: loginTest.id,
      type: 'type',
      order: 2,
      selector: '#login-form input[name="username"]',
      text: 'testuser@example.com'
    });

    this.createTestStepInternal({
      testId: loginTest.id,
      type: 'verify',
      order: 3,
      selector: '.welcome-message',
      condition: 'exists'
    });
  }

  // Internal methods that don't use async for simplicity
  private createTestSuiteInternal(data: InsertTestSuite): TestSuite {
    const now = new Date().toISOString();
    const suite: TestSuite = {
      id: this.testSuiteId++,
      name: data.name,
      createdAt: now
    };
    this.testSuites.set(suite.id, suite);
    return suite;
  }

  private createTestInternal(data: InsertTest): Test {
    const now = new Date().toISOString();
    const test: Test = {
      id: this.testId++,
      name: data.name,
      suiteId: data.suiteId,
      createdAt: now
    };
    this.tests.set(test.id, test);
    return test;
  }

  private createTestStepInternal(data: InsertTestStep): TestStep {
    const now = new Date().toISOString();
    const step: TestStep = {
      id: this.testStepId++,
      testId: data.testId,
      type: data.type,
      order: data.order,
      selector: data.selector,
      text: data.text,
      url: data.url,
      condition: data.condition,
      duration: data.duration,
      direction: data.direction,
      createdAt: now
    };
    this.testSteps.set(step.id, step);
    return step;
  }

  // Test Suites
  async getTestSuites(): Promise<TestSuite[]> {
    const suites = Array.from(this.testSuites.values());
    
    // Calculate test count for each suite
    return suites.map(suite => {
      const testCount = Array.from(this.tests.values())
        .filter(test => test.suiteId === suite.id)
        .length;
      
      return {
        ...suite,
        testCount
      } as TestSuite & { testCount: number };
    });
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    return this.testSuites.get(id);
  }

  async createTestSuite(data: InsertTestSuite): Promise<TestSuite> {
    return this.createTestSuiteInternal(data);
  }

  async updateTestSuite(id: number, data: Partial<TestSuite>): Promise<TestSuite | undefined> {
    const suite = this.testSuites.get(id);
    if (!suite) return undefined;

    const updatedSuite = { ...suite, ...data };
    this.testSuites.set(id, updatedSuite);
    return updatedSuite;
  }

  async deleteTestSuite(id: number): Promise<void> {
    this.testSuites.delete(id);
    
    // Delete associated tests and their steps
    const testsToDelete = Array.from(this.tests.values())
      .filter(test => test.suiteId === id);
    
    for (const test of testsToDelete) {
      await this.deleteTest(test.id);
    }
  }

  // Tests
  async getTests(): Promise<Test[]> {
    const tests = Array.from(this.tests.values());
    
    // Add steps to each test
    return Promise.all(tests.map(async test => {
      const steps = await this.getTestSteps(test.id);
      return { ...test, steps };
    }));
  }

  async getTest(id: number): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;

    // Get steps for this test
    const steps = await this.getTestSteps(id);
    return { ...test, steps };
  }

  async getTestsBySuite(suiteId: number): Promise<Test[]> {
    const tests = Array.from(this.tests.values())
      .filter(test => test.suiteId === suiteId);
    
    // Add steps to each test
    return Promise.all(tests.map(async test => {
      const steps = await this.getTestSteps(test.id);
      return { ...test, steps };
    }));
  }

  async createTest(data: InsertTest): Promise<Test> {
    return this.createTestInternal(data);
  }

  async updateTest(id: number, data: Partial<Test>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;

    const updatedTest = { ...test, ...data };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }

  async deleteTest(id: number): Promise<void> {
    this.tests.delete(id);
    
    // Delete associated steps
    await this.deleteAllTestSteps(id);
  }

  async getRecentTests(limit: number): Promise<any[]> {
    // Sort tests by lastRun date (if available)
    const tests = Array.from(this.tests.values())
      .filter(test => test.lastRun) // Only include tests that have been run
      .sort((a, b) => {
        if (!a.lastRun || !b.lastRun) return 0;
        return new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime();
      })
      .slice(0, limit);

    // Format tests for UI display
    return tests.map(test => ({
      id: test.id,
      name: test.name,
      status: test.lastStatus,
      executedAt: test.lastRun
    }));
  }

  // Test Steps
  async getTestSteps(testId: number): Promise<TestStep[]> {
    const steps = Array.from(this.testSteps.values())
      .filter(step => step.testId === testId)
      .sort((a, b) => a.order - b.order);
    
    return steps;
  }

  async getTestStep(id: number): Promise<TestStep | undefined> {
    return this.testSteps.get(id);
  }

  async createTestStep(data: InsertTestStep): Promise<TestStep> {
    return this.createTestStepInternal(data);
  }

  async updateTestStep(id: number, data: Partial<TestStep>): Promise<TestStep | undefined> {
    const step = this.testSteps.get(id);
    if (!step) return undefined;

    const updatedStep = { ...step, ...data };
    this.testSteps.set(id, updatedStep);
    return updatedStep;
  }

  async deleteTestStep(id: number): Promise<void> {
    this.testSteps.delete(id);
  }

  async deleteAllTestSteps(testId: number): Promise<void> {
    const stepsToDelete = Array.from(this.testSteps.values())
      .filter(step => step.testId === testId);
    
    for (const step of stepsToDelete) {
      this.testSteps.delete(step.id);
    }
  }

  async reorderTestSteps(steps: { id: number, order: number }[]): Promise<void> {
    for (const { id, order } of steps) {
      const step = this.testSteps.get(id);
      if (step) {
        this.testSteps.set(id, { ...step, order });
      }
    }
  }

  // Test Runs
  async getTestRun(id: number): Promise<TestRun | undefined> {
    return this.testRuns.get(id);
  }

  async createTestRun(data: InsertTestRun): Promise<TestRun> {
    const now = new Date().toISOString();
    const run: TestRun = {
      id: this.testRunId++,
      status: data.status,
      startTime: now,
      totalTests: data.totalTests,
      completedTests: 0,
      passedTests: 0,
      failedTests: 0
    };
    this.testRuns.set(run.id, run);
    return run;
  }

  async updateTestRun(id: number, data: Partial<TestRun>): Promise<TestRun | undefined> {
    const run = this.testRuns.get(id);
    if (!run) return undefined;

    const updatedRun = { ...run, ...data };
    this.testRuns.set(id, updatedRun);
    return updatedRun;
  }

  async getRecentTestRuns(limit: number): Promise<any[]> {
    // Sort runs by startTime date
    const runs = Array.from(this.testRuns.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);

    // Format runs for UI display with some additional info
    return runs.map(run => {
      // Calculate duration if run is completed
      let duration = 0;
      if (run.endTime) {
        duration = Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000);
      }

      // Calculate pass rate
      const passRate = run.totalTests > 0 
        ? Math.round((run.passedTests / run.totalTests) * 100) 
        : 0;

      return {
        id: run.id,
        status: run.status,
        startTime: run.startTime,
        endTime: run.endTime,
        duration,
        passRate,
        suiteName: 'Various', // Would need to be calculated based on the tests run
      };
    });
  }

  // Test Results
  async getTestResult(id: number): Promise<TestResult | undefined> {
    return this.testResults.get(id);
  }

  async getTestResultsByRun(runId: number): Promise<TestResult[]> {
    return Array.from(this.testResults.values())
      .filter(result => result.runId === runId);
  }

  async createTestResult(data: InsertTestResult): Promise<TestResult> {
    const now = new Date().toISOString();
    const result: TestResult = {
      id: this.testResultId++,
      runId: data.runId,
      testId: data.testId,
      passed: data.passed,
      failed: data.failed,
      duration: data.duration,
      steps: data.steps,
      error: data.error,
      createdAt: now
    };
    this.testResults.set(result.id, result);
    return result;
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values())
      .find(setting => setting.key === key);
  }

  async createOrUpdateSetting(key: string, value: any): Promise<Setting> {
    const now = new Date().toISOString();
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      const updatedSetting = { ...existingSetting, value, updatedAt: now };
      this.settings.set(existingSetting.id, updatedSetting);
      return updatedSetting;
    }
    
    const newSetting: Setting = {
      id: this.settingId++,
      key,
      value,
      updatedAt: now
    };
    this.settings.set(newSetting.id, newSetting);
    return newSetting;
  }

  // Dashboard & Reports
  async getTotalTests(): Promise<number> {
    return this.tests.size;
  }

  async getSuccessRate(): Promise<number> {
    const results = Array.from(this.testResults.values());
    if (results.length === 0) return 0;

    const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
    const totalSteps = results.reduce((sum, result) => sum + result.passed + result.failed, 0);
    
    return totalSteps > 0 ? Math.round((totalPassed / totalSteps) * 100) : 0;
  }

  async getExecutionsCountToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.testRuns.values())
      .filter(run => new Date(run.startTime) >= today)
      .length;
  }

  async getTestRunsByDay(): Promise<any[]> {
    // Mock data for test runs by day (past 7 days)
    const days = 7;
    const result = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate some sample data
      // In a real app, this would query from actual test results
      result.unshift({
        date: dateStr,
        passed: Math.floor(Math.random() * 10) + 5,
        failed: Math.floor(Math.random() * 5)
      });
    }
    
    return result;
  }

  async getTotalTestRuns(): Promise<number> {
    return this.testRuns.size;
  }

  async getTotalPassedTests(): Promise<number> {
    return Array.from(this.testResults.values())
      .reduce((sum, result) => sum + result.passed, 0);
  }

  async getTotalFailedTests(): Promise<number> {
    return Array.from(this.testResults.values())
      .reduce((sum, result) => sum + result.failed, 0);
  }

  async getAverageTestDuration(): Promise<number> {
    const results = Array.from(this.testResults.values());
    if (results.length === 0) return 0;
    
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
    return Math.round((totalDuration / results.length) / 1000); // Convert ms to seconds
  }

  async getSuccessRateTrend(): Promise<any[]> {
    // Mock data for success rate trend (past 30 days)
    const days = 30;
    const result = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate some sample success rate data
      result.unshift({
        date: dateStr,
        successRate: Math.floor(Math.random() * 30) + 70 // 70-100%
      });
    }
    
    return result;
  }
}

export const storage = new MemStorage();
