// Puppeteer-based browser automation for recording and playing test actions
import puppeteer, { Browser, Page } from 'puppeteer';
import { Test } from '@shared/schema';

// Define interfaces for recorder functionality
interface RecordingConfig {
  testName: string;
  targetUrl: string;
  browser: string;
}

interface PlayConfig {
  testName: string;
  browser: string;
  steps: string[];
}

class Recorder {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRecording: boolean = false;
  private recordedSteps: string[] = [];
  private config: RecordingConfig | null = null;

  // Start recording a new test
  async startRecording(config: RecordingConfig): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress. Stop the current recording first.');
    }

    this.config = config;
    this.recordedSteps = [];
    this.isRecording = true;

    try {
      // Launch the browser
      this.browser = await puppeteer.launch({
        headless: false, // Need a visible browser for recording
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      // Create a new page
      this.page = await this.browser.newPage();
      
      // Setup event listeners for user interactions
      await this.setupRecordingListeners();
      
      // Navigate to the target URL
      await this.page.goto(config.targetUrl, { waitUntil: 'networkidle2' });
      
      // Add first step - navigation
      this.recordedSteps.push(`Navigate to ${config.targetUrl}`);
      
      console.log(`Recording started: ${config.testName}`);
    } catch (error) {
      this.isRecording = false;
      throw error;
    }
  }

  // Stop recording and close the browser
  async stopRecording(): Promise<string[]> {
    if (!this.isRecording) {
      throw new Error('No recording in progress.');
    }

    try {
      // Close the browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
      
      this.isRecording = false;
      console.log('Recording stopped');
      
      return this.recordedSteps;
    } catch (error) {
      throw error;
    }
  }

  // Get the current recorded steps
  async getRecordedSteps(): Promise<string[]> {
    return this.recordedSteps;
  }

  // Play a recording with provided steps
  async playRecording(config: PlayConfig): Promise<void> {
    if (this.isRecording) {
      throw new Error('Cannot play recording while recording is in progress.');
    }

    try {
      console.log(`Playing recording: ${config.testName}`);
      
      // Launch the browser
      this.browser = await puppeteer.launch({
        headless: true, // Run headless for playing recordings
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      // Create a new page
      this.page = await this.browser.newPage();
      
      // Execute each step
      for (const step of config.steps) {
        await this.executeStep(step);
      }
      
      console.log('Recording playback completed successfully');
      
      // Close the browser
      await this.browser.close();
      this.browser = null;
      this.page = null;
    } catch (error) {
      // Clean up if there's an error
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
      throw error;
    }
  }

  // Play a test from database
  async playTest(test: Test): Promise<void> {
    return this.playRecording({
      testName: test.name,
      browser: test.browser,
      steps: test.steps as string[]
    });
  }

  // Private methods

  // Setup event listeners for recording user interactions
  private async setupRecordingListeners(): Promise<void> {
    if (!this.page) return;

    // Listen for clicks
    await this.page.evaluateOnNewDocument(() => {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        let selector = '';
        
        // Try to get the best selector for this element
        if (target.id) {
          selector = `#${target.id}`;
        } else if (target.className && typeof target.className === 'string') {
          selector = `.${target.className.replace(/\s+/g, '.')}`;
        } else {
          selector = target.tagName.toLowerCase();
          if (target.hasAttribute('name')) {
            selector += `[name="${target.getAttribute('name')}"]`;
          }
        }
        
        // Send info back to Node.js context
        window.postMessage({
          type: 'RECORDER_CLICK',
          selector,
          text: target.textContent?.trim(),
          innerText: target.innerText?.trim()
        }, '*');
      }, true);
      
      // Listen for input changes
      document.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.tagName.toLowerCase() === 'input' || 
            target.tagName.toLowerCase() === 'textarea' ||
            target.tagName.toLowerCase() === 'select') {
          
          let selector = '';
          if (target.id) {
            selector = `#${target.id}`;
          } else if (target.name) {
            selector = `${target.tagName.toLowerCase()}[name="${target.name}"]`;
          } else if (target.className && typeof target.className === 'string') {
            selector = `.${target.className.replace(/\s+/g, '.')}`;
          } else {
            selector = target.tagName.toLowerCase();
          }
          
          const value = target.value;
          
          // Send info back to Node.js context
          window.postMessage({
            type: 'RECORDER_INPUT',
            selector,
            value
          }, '*');
        }
      }, true);
      
      // Listen for form submissions
      document.addEventListener('submit', (event) => {
        const form = event.target as HTMLFormElement;
        let selector = '';
        
        if (form.id) {
          selector = `#${form.id}`;
        } else if (form.className && typeof form.className === 'string') {
          selector = `.${form.className.replace(/\s+/g, '.')}`;
        } else {
          selector = 'form';
        }
        
        // Send info back to Node.js context
        window.postMessage({
          type: 'RECORDER_SUBMIT',
          selector
        }, '*');
      }, true);
    });

    // Listen for console messages from the page
    this.page.on('console', async (message) => {
      // Filter for our recorder messages
      const text = message.text();
      if (text.includes('RECORDER_')) {
        try {
          const json = JSON.parse(text);
          if (json.type === 'RECORDER_CLICK') {
            let description = '';
            if (json.text) {
              description = `Click on "${json.text}" (${json.selector})`;
            } else {
              description = `Click on ${json.selector}`;
            }
            this.recordedSteps.push(description);
          } else if (json.type === 'RECORDER_INPUT') {
            this.recordedSteps.push(`Type "${json.value}" in ${json.selector}`);
          } else if (json.type === 'RECORDER_SUBMIT') {
            this.recordedSteps.push(`Submit form ${json.selector}`);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    // Listen for navigation events
    this.page.on('framenavigated', async (frame) => {
      if (frame === this.page.mainFrame()) {
        const url = frame.url();
        if (url !== 'about:blank' && this.recordedSteps.length > 0) {
          // Don't record the initial navigation, it's already handled
          this.recordedSteps.push(`Navigate to ${url}`);
        }
      }
    });

    // Expose a function to record steps manually
    await this.page.exposeFunction('recordStep', (step: string) => {
      this.recordedSteps.push(step);
    });
  }

  // Execute a single step during playback
  private async executeStep(step: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    console.log(`Executing step: ${step}`);

    // Parse different types of steps
    if (step.startsWith('Navigate to ')) {
      const url = step.replace('Navigate to ', '');
      await this.page.goto(url, { waitUntil: 'networkidle2' });
    } 
    else if (step.startsWith('Click on ')) {
      // Extract the selector or text to click
      let selector = '';
      if (step.includes('(') && step.includes(')')) {
        // The format is "Click on "text" (selector)"
        selector = step.substring(step.lastIndexOf('(') + 1, step.lastIndexOf(')'));
      } else {
        // The format is "Click on selector"
        selector = step.replace('Click on ', '');
      }
      
      // Wait for the element to be visible
      await this.page.waitForSelector(selector, { visible: true, timeout: 10000 });
      await this.page.click(selector);
    }
    else if (step.startsWith('Type ')) {
      // Format: Type "text" in selector
      const textMatch = step.match(/Type "([^"]*)" in (.*)/);
      if (textMatch && textMatch.length >= 3) {
        const text = textMatch[1];
        const selector = textMatch[2];
        
        // Wait for the element to be visible
        await this.page.waitForSelector(selector, { visible: true, timeout: 10000 });
        
        // Clear the input first
        await this.page.$eval(selector, (el: HTMLInputElement) => el.value = '');
        
        // Type the text
        await this.page.type(selector, text);
      }
    }
    else if (step.startsWith('Submit form ')) {
      const selector = step.replace('Submit form ', '');
      await this.page.evaluate((sel) => {
        const form = document.querySelector(sel) as HTMLFormElement;
        if (form) form.submit();
      }, selector);
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    else if (step.startsWith('Wait for ')) {
      // Format: Wait for selector to be visible
      // or: Wait for navigation
      if (step.includes(' to be visible')) {
        const selector = step.replace('Wait for ', '').replace(' to be visible', '');
        await this.page.waitForSelector(selector, { visible: true, timeout: 10000 });
      } else if (step.includes('navigation')) {
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      } else if (step.includes('timeout')) {
        const timeout = parseInt(step.replace('Wait for ', '').replace(' ms', ''));
        await new Promise(resolve => setTimeout(resolve, timeout));
      }
    }
    else if (step.startsWith('Assert ')) {
      // Format: Assert selector is visible
      // or: Assert selector count > number
      // or: Assert URL contains "text"
      
      if (step.includes(' is visible')) {
        const selector = step.replace('Assert ', '').replace(' is visible', '');
        await this.page.waitForSelector(selector, { visible: true, timeout: 10000 });
      } 
      else if (step.includes(' count ')) {
        // Assert selector count > number
        const parts = step.replace('Assert ', '').split(' count ');
        const selector = parts[0];
        const comparison = parts[1]; // e.g., "> 0"
        
        const count = await this.page.$$eval(selector, (elements) => elements.length);
        
        if (comparison.includes('>')) {
          const expectedCount = parseInt(comparison.replace('>', '').trim());
          if (count <= expectedCount) {
            throw new Error(`Assertion failed: ${selector} count ${count} is not > ${expectedCount}`);
          }
        } else if (comparison.includes('<')) {
          const expectedCount = parseInt(comparison.replace('<', '').trim());
          if (count >= expectedCount) {
            throw new Error(`Assertion failed: ${selector} count ${count} is not < ${expectedCount}`);
          }
        } else if (comparison.includes('=')) {
          const expectedCount = parseInt(comparison.replace('=', '').trim());
          if (count !== expectedCount) {
            throw new Error(`Assertion failed: ${selector} count ${count} is not = ${expectedCount}`);
          }
        }
      }
      else if (step.includes('URL contains')) {
        const expectedText = step.match(/URL contains ['"]([^'"]*)['"]/)?.[1];
        if (expectedText) {
          const url = await this.page.url();
          if (!url.includes(expectedText)) {
            throw new Error(`Assertion failed: URL ${url} does not contain "${expectedText}"`);
          }
        }
      }
    }
    
    // Add a small delay between steps for stability
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Export a singleton instance
export const recorder = new Recorder();
