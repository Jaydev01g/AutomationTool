import { TestStep } from "@/lib/types";
import { Test } from "@shared/schema";
import puppeteer, { Browser, Page } from "puppeteer";

let browser: Browser | null = null;
let page: Page | null = null;
let isRecording = false;
let actionCallback: ((action: { description: string; step: any }) => void) | null = null;

/**
 * Start the browser instance
 */
export async function startBrowser(): Promise<void> {
  console.log("Starting Puppeteer browser...");
  browser = await puppeteer.launch({ headless: false }); // Launch browser in non-headless mode
  page = await browser.newPage(); // Open a new page
  console.log("Browser started for recording/playback");
}

/**
 * Stop the browser instance
 */
export async function stopBrowser(): Promise<void> {
  if (browser) {
    console.log("Stopping Puppeteer browser...");
    await browser.close();
    browser = null;
    page = null;
    isRecording = false;
    actionCallback = null;
    console.log("Browser stopped");
  }
}

/**
 * Start recording user actions
 */
export function recordActions(callback: (action: { description: string; step: any }) => void): void {
  if (!page) {
    throw new Error("Browser not started");
  }

  isRecording = true;
  actionCallback = callback;

  console.log("Recording started");

  // Inject a script into the page to capture user actions
  injectRecordingScript();
}

/**
 * Inject a script into the page to capture user actions
 */
async function injectRecordingScript(): Promise<void> {
  if (!page) {
    throw new Error("Browser not started");
  }

  await page.exposeFunction("recordAction", (action: { description: string; step: any }) => {
    if (isRecording && actionCallback) {
      actionCallback(action);
    }
  });

  await page.evaluate(() => {
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const action = {
        description: `Clicked on ${target.tagName}${target.id ? `#${target.id}` : ""}`,
        step: {
          type: "click",
          selector: target.id ? `#${target.id}` : "",
        },
      };
      (window as any).recordAction(action);
    });

    document.addEventListener("input", (event) => {
      const target = event.target as HTMLInputElement;
      const action = {
        description: `Input in ${target.tagName}${target.id ? `#${target.id}` : ""}`,
        step: {
          type: "type",
          selector: target.id ? `#${target.id}` : "",
          text: target.value,
        },
      };
      (window as any).recordAction(action);
    });

    document.addEventListener("keydown", (event) => {
      const action = {
        description: `Key pressed: ${event.key}`,
        step: {
          type: "keydown",
          key: event.key,
        },
      };
      (window as any).recordAction(action);
    });
  });
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

  if (!browser) {
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
    for (let i = 0; i < test.steps.length; i++) {
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
  if (!page) {
    throw new Error("Browser not started");
  }

  switch (step.type) {
    case "navigate":
      if (!step.url) throw new Error("URL is required for navigate step");
      await page.goto(step.url);
      break;

    case "click":
      if (!step.selector) throw new Error("Selector is required for click step");
      await page.waitForSelector(step.selector);
      await page.click(step.selector);
      break;

    case "type":
      if (!step.selector) throw new Error("Selector is required for type step");
      if (!step.text) throw new Error("Text is required for type step");
      await page.waitForSelector(step.selector);
      await page.type(step.selector, step.text);
      break;

    case "wait":
      if (!step.duration) throw new Error("Duration is required for wait step");
      await new Promise((resolve) => setTimeout(resolve, step.duration));
      break;

    case "scroll":
      if (!step.direction) throw new Error("Direction is required for scroll step");
      await page.evaluate((direction: string) => {
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