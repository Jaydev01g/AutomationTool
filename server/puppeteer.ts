import { TestStep } from "@/lib/types";
import { Test } from "@shared/schema";

// Mock browser and page for simulation
let mockBrowser: any = null;
let mockPage: any = null;
let isRecording = false;
let actionCallback: ((action: { description: string; step: any }) => void) | null = null;

/**
 * Start the browser instance
 */
export async function startBrowser(): Promise<void> {
  console.log("Browser started for recording/playback");

  mockBrowser = {
    close: async () => console.log("Browser closed"),
  };

  mockPage = {
    goto: async (url: string) => console.log(`Navigated to ${url}`),
    click: async (selector: string) => console.log(`Clicked on ${selector}`),
    type: async (selector: string, text: string) => console.log(`Typed "${text}" into ${selector}`),
    waitForSelector: async (selector: string) => console.log(`Waited for ${selector}`),
    evaluate: async (fn: Function, ...args: any[]) => console.log("Evaluated JavaScript in page", fn, args),
    $: async (selector: string) => ({ exists: true }),
    waitForTimeout: async (ms: number) => console.log(`Waited for ${ms}ms`),
  };

  isRecording = false;
}

/**
 * Stop the browser instance
 */
export async function stopBrowser(): Promise<void> {
  if (mockBrowser) {
    console.log("Browser stopped");
    mockBrowser = null;
    mockPage = null;
    isRecording = false;
    actionCallback = null;
  }
}

/**
 * Start recording user actions
 */
export function recordActions(callback: (action: { description: string; step: any }) => void): void {
  if (!mockPage) {
    throw new Error("Browser not started");
  }

  isRecording = true;
  actionCallback = callback;

  console.log("Recording started");

  // Simulate recording actions
  simulateRecording();
}

/**
 * Simulate recording actions (for demo purposes)
 */
function simulateRecording(): void {
  if (!isRecording || !actionCallback) return;

  setTimeout(() => {
    // Simulate navigation
    actionCallback?.({
      description: "Navigate to https://example.com",
      step: {
        id: Date.now(),
        type: "navigate",
        url: "https://example.com",
        order: 0,  
    },
    });

    // Simulate click
    setTimeout(() => {
      actionCallback?.({
        description: "Click on #login-button",
        step: {
          id: Date.now(),
          type: "click",
          selector: "#login-button",
          order: 1,
        },
      });

      // Simulate typing
      setTimeout(() => {
        actionCallback?.({
          description: "Type into #username-field",
          step: {
            id: Date.now(),
            type: "type",
            selector: "#username-field",
            text: "testuser@example.com",
            order: 2,
          },
        });
      }, 2000);
    }, 2000);
  }, 1000);
}

/**
 * Play back a test
 */
export async function playbackTest(test: Test & { steps: TestStep[] }): Promise<{
  passed: number;
  failed: number;
  duration: number;
  steps: any[];
  error?: {
    stepIndex: number;
    action: string;
    message: string;
  };
}> {
  console.log(`Playing back test: ${test.name}`);

  if (!mockBrowser) {
    await startBrowser();
  }

  const startTime = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    duration: 0,
    steps: [] as any[],
    error: undefined as {
      stepIndex: number;
      action: string;
      message: string;
    } | undefined,
  };

  try {
    for (let i = 0; i < (test.steps as TestStep[]).length; i++) {
      const step = test.steps[i];
      const stepStartTime = Date.now();
      let stepPassed = true;

      try {
        await executeStep(step);
        results.passed++;
      } catch (error) {
        stepPassed = false;
        results.failed++;
        results.error = {
          stepIndex: i,
          action: step.type,
          message: (error as Error).message,
        };
        break; // Stop execution on first failure
      }

      const stepDuration = Date.now() - stepStartTime;
      results.steps.push({
        type: step.type,
        status: stepPassed ? "passed" : "failed",
        selector: step.selector,
        url: step.url,
        duration: stepDuration,
      });
    }
  } finally {
    results.duration = Date.now() - startTime;
  }

  return results;
}

/**
 * Execute a single test step
 */
async function executeStep(step: TestStep): Promise<void> {
  if (!mockPage) {
    throw new Error("Browser not started");
  }

  switch (step.type) {
    case "navigate":
      if (!step.url) throw new Error("URL is required for navigate step");
      await mockPage.goto(step.url);
      break;

    case "click":
      if (!step.selector) throw new Error("Selector is required for click step");
      await mockPage.waitForSelector(step.selector);
      await mockPage.click(step.selector);
      break;

    case "type":
      if (!step.selector) throw new Error("Selector is required for type step");
      if (!step.text) throw new Error("Text is required for type step");
      await mockPage.waitForSelector(step.selector);
      await mockPage.type(step.selector, step.text);
      break;

    case "wait":
      if (!step.duration) throw new Error("Duration is required for wait step");
      await mockPage.waitForTimeout(step.duration);
      break;

    case "scroll":
      if (!step.direction) throw new Error("Direction is required for scroll step");
      await mockPage.evaluate((direction: string) => {
        const scrollAmount = 300;
        switch (direction) {
          case "up":
            window.scrollBy(0, -scrollAmount);
            break;
          case "down":
            window.scrollBy(0, scrollAmount);
            break;
          case "left":
            window.scrollBy(-scrollAmount, 0);
            break;
          case "right":
            window.scrollBy(scrollAmount, 0);
            break;
        }
      }, step.direction);
      break;

    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}