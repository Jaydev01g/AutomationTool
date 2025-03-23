import { 
  InsertTest, InsertTestExecution, InsertTestSuite, 
  Test, TestExecution, TestSuite, TestSuiteStatus, 
  DashboardMetrics, ReportSummary 
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Test operations
  getAllTests(): Promise<Test[]>;
  getTest(id: number): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<void>;
  
  // Test suite operations
  getAllTestSuites(): Promise<TestSuite[]>;
  getTestSuite(id: number): Promise<TestSuite | undefined>;
  createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite>;
  updateTestSuite(id: number, testSuite: Partial<InsertTestSuite>): Promise<TestSuite | undefined>;
  deleteTestSuite(id: number): Promise<void>;
  getTestSuitesStatus(): Promise<TestSuiteStatus[]>;
  
  // Test execution operations
  getAllTestExecutions(): Promise<TestExecution[]>;
  getRecentTestExecutions(limit?: number): Promise<TestExecution[]>;
  createTestExecution(execution: Partial<InsertTestExecution>): Promise<TestExecution>;
  
  // Dashboard and reporting operations
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getReportSummary(): Promise<ReportSummary>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private tests: Map<number, Test>;
  private testSuites: Map<number, TestSuite>;
  private testExecutions: Map<number, TestExecution>;
  private currentTestId: number;
  private currentTestSuiteId: number;
  private currentTestExecutionId: number;
  
  constructor() {
    this.tests = new Map();
    this.testSuites = new Map();
    this.testExecutions = new Map();
    this.currentTestId = 1;
    this.currentTestSuiteId = 1;
    this.currentTestExecutionId = 1;
    
    // Add some initial test executions for the dashboard
    this.seedSampleData();
  }
  
  // Test operations
  
  async getAllTests(): Promise<Test[]> {
    return Array.from(this.tests.values());
  }
  
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }
  
  async createTest(test: InsertTest): Promise<Test> {
    const id = this.currentTestId++;
    const now = new Date().toISOString();
    
    const newTest: Test = {
      id,
      name: test.name,
      description: test.description || "",
      targetUrl: test.targetUrl,
      browser: test.browser,
      steps: test.steps || [],
      lastStatus: null,
      lastRun: null,
      userId: test.userId || 1,
      createdAt: now,
      updatedAt: now
    };
    
    this.tests.set(id, newTest);
    return newTest;
  }
  
  async updateTest(id: number, testUpdate: Partial<InsertTest>): Promise<Test | undefined> {
    const existingTest = this.tests.get(id);
    
    if (!existingTest) {
      return undefined;
    }
    
    const updatedTest: Test = {
      ...existingTest,
      ...testUpdate,
      updatedAt: new Date().toISOString()
    };
    
    this.tests.set(id, updatedTest);
    return updatedTest;
  }
  
  async deleteTest(id: number): Promise<void> {
    this.tests.delete(id);
  }
  
  // Test suite operations
  
  async getAllTestSuites(): Promise<TestSuite[]> {
    return Array.from(this.testSuites.values());
  }
  
  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    return this.testSuites.get(id);
  }
  
  async createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite> {
    const id = this.currentTestSuiteId++;
    const now = new Date().toISOString();
    
    const newTestSuite: TestSuite = {
      id,
      name: testSuite.name,
      description: testSuite.description || "",
      testIds: testSuite.testIds || [],
      userId: testSuite.userId || 1,
      createdAt: now,
      updatedAt: now,
      testCount: (testSuite.testIds as number[]).length,
      successRate: 0,
      lastRun: null
    };
    
    this.testSuites.set(id, newTestSuite);
    return newTestSuite;
  }
  
  async updateTestSuite(id: number, testSuiteUpdate: Partial<InsertTestSuite>): Promise<TestSuite | undefined> {
    const existingTestSuite = this.testSuites.get(id);
    
    if (!existingTestSuite) {
      return undefined;
    }
    
    const updatedTestSuite: TestSuite = {
      ...existingTestSuite,
      ...testSuiteUpdate,
      testCount: testSuiteUpdate.testIds ? (testSuiteUpdate.testIds as number[]).length : existingTestSuite.testCount,
      updatedAt: new Date().toISOString()
    };
    
    this.testSuites.set(id, updatedTestSuite);
    return updatedTestSuite;
  }
  
  async deleteTestSuite(id: number): Promise<void> {
    this.testSuites.delete(id);
  }
  
  async getTestSuitesStatus(): Promise<TestSuiteStatus[]> {
    return Array.from(this.testSuites.values()).map(suite => ({
      id: suite.id,
      name: suite.name,
      successRate: suite.successRate || Math.floor(Math.random() * 101), // For demo
      passed: Math.floor(Math.random() * 10),
      failed: Math.floor(Math.random() * 5),
      lastRun: suite.lastRun || this.getRandomDate()
    }));
  }
  
  // Test execution operations
  
  async getAllTestExecutions(): Promise<TestExecution[]> {
    return Array.from(this.testExecutions.values());
  }
  
  async getRecentTestExecutions(limit: number = 5): Promise<TestExecution[]> {
    return Array.from(this.testExecutions.values())
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, limit);
  }
  
  async createTestExecution(execution: Partial<InsertTestExecution>): Promise<TestExecution> {
    const id = this.currentTestExecutionId++;
    const now = new Date().toISOString();
    
    const newExecution: TestExecution = {
      id,
      testId: execution.testId || null,
      testName: execution.testName || "Unnamed Test",
      browser: execution.browser || "Chrome",
      status: execution.status || "pending",
      duration: execution.duration || "0s",
      logs: execution.logs || [],
      screenshots: execution.screenshots || [],
      userId: execution.userId || 1,
      executedAt: now
    };
    
    this.testExecutions.set(id, newExecution);
    
    // Update test suite success rate if applicable
    if (execution.testId) {
      this.updateTestSuiteStatus(execution.testId, execution.status === "passed");
    }
    
    return newExecution;
  }
  
  // Dashboard and reporting operations
  
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const tests = Array.from(this.tests.values());
    const executions = Array.from(this.testExecutions.values());
    
    const totalTests = tests.length;
    const passedExecutions = executions.filter(exec => exec.status === "passed").length;
    const failedExecutions = executions.filter(exec => exec.status === "failed").length;
    const totalExecutions = passedExecutions + failedExecutions;
    
    return {
      testCases: totalTests,
      testCasesTrend: 12,
      successRate: totalExecutions ? Math.round((passedExecutions / totalExecutions) * 100) : 0,
      successRateTrend: 3,
      failedTests: failedExecutions,
      failedTestsTrend: 2,
      avgExecutionTime: 3.2,
      executionTimeTrend: -8
    };
  }
  
  async getReportSummary(): Promise<ReportSummary> {
    const executions = Array.from(this.testExecutions.values());
    const totalTests = executions.length;
    const passed = executions.filter(exec => exec.status === "passed").length;
    const failed = executions.filter(exec => exec.status === "failed").length;
    
    return {
      totalTests,
      passed,
      failed,
      passRate: totalTests ? Math.round((passed / totalTests) * 100) : 0,
      failRate: totalTests ? Math.round((failed / totalTests) * 100) : 0,
      avgDuration: "2m 30s"
    };
  }
  
  // Helper methods
  
  private updateTestSuiteStatus(testId: number, isPassed: boolean): void {
    // Find all test suites containing this test
    for (const suite of this.testSuites.values()) {
      if ((suite.testIds as number[]).includes(testId)) {
        // Update last run date
        suite.lastRun = new Date().toISOString();
        
        // Recalculate success rate
        const testIds = suite.testIds as number[];
        const tests = testIds.map(id => this.tests.get(id)).filter(Boolean) as Test[];
        
        const passedTests = tests.filter(test => test.lastStatus === "passed").length;
        const totalTests = tests.length;
        
        suite.successRate = totalTests ? Math.round((passedTests / totalTests) * 100) : 0;
        
        this.testSuites.set(suite.id, suite);
      }
    }
  }
  
  private getRandomDate(daysBack: number = 7): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
  }
  
  // Seed some initial data for demo purposes
  private seedSampleData(): void {
    // Sample tests
    const test1 = this.createTest({
      name: "Login Authentication",
      description: "Tests the login functionality",
      targetUrl: "https://example.com/login",
      browser: "Chrome",
      steps: [
        "Navigate to https://example.com/login",
        "Type 'testuser' in input[name='username']",
        "Type 'password123' in input[name='password']",
        "Click on button[type='submit']",
        "Wait for navigation",
        "Assert URL contains '/dashboard'"
      ]
    });
    
    const test2 = this.createTest({
      name: "Product Search",
      description: "Tests the product search functionality",
      targetUrl: "https://example.com/shop",
      browser: "Chrome",
      steps: [
        "Navigate to https://example.com/shop",
        "Type 'laptop' in input[name='search']",
        "Click on button.search-button",
        "Wait for .product-list to be visible",
        "Assert .product-card count > 0"
      ]
    });
    
    const test3 = this.createTest({
      name: "Checkout Process",
      description: "Tests the checkout flow",
      targetUrl: "https://example.com/cart",
      browser: "Firefox",
      steps: [
        "Navigate to https://example.com/cart",
        "Click on button.proceed-checkout",
        "Fill in shipping details",
        "Click on button.continue",
        "Select payment method 'Credit Card'",
        "Fill in payment details",
        "Click on button.place-order",
        "Assert .order-confirmation is visible"
      ]
    });
    
    // Execute promise right away to get the test IDs
    Promise.all([test1, test2, test3]).then(tests => {
      // Sample test executions
      this.createTestExecution({
        testId: tests[0].id,
        testName: "Login Authentication",
        browser: "Chrome",
        status: "passed",
        duration: "2m 15s",
      });
      
      this.createTestExecution({
        testId: tests[1].id,
        testName: "Product Search",
        browser: "Chrome",
        status: "failed",
        duration: "1m 47s",
      });
      
      this.createTestExecution({
        testId: tests[2].id,
        testName: "Checkout Process",
        browser: "Firefox",
        status: "passed",
        duration: "3m 22s",
      });
      
      // Sample test suite
      this.createTestSuite({
        name: "E-commerce User Flow",
        description: "Tests the complete e-commerce user flow",
        testIds: [tests[0].id, tests[1].id, tests[2].id],
      });
      
      this.createTestSuite({
        name: "Admin Dashboard",
        description: "Tests the admin dashboard functionality",
        testIds: [tests[0].id],
      });
      
      this.createTestSuite({
        name: "API Integration Tests",
        description: "Tests the API integration",
        testIds: [tests[1].id, tests[2].id],
      });
      
      // Update tests with last execution info
      this.updateTest(tests[0].id, {
        lastStatus: "passed",
        lastRun: new Date().toISOString()
      });
      
      this.updateTest(tests[1].id, {
        lastStatus: "failed",
        lastRun: new Date().toISOString()
      });
      
      this.updateTest(tests[2].id, {
        lastStatus: "passed",
        lastRun: new Date().toISOString()
      });
    });
  }
}

// Export a singleton instance of MemStorage
export const storage = new MemStorage();
