import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { recorder } from "./recorder";
import { insertTestSchema, insertTestExecutionSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from 'zod-validation-error';

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for tests
  app.get("/api/tests", async (req, res) => {
    try {
      const tests = await storage.getAllTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const test = await storage.getTest(id);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test" });
    }
  });

  app.post("/api/tests", async (req, res) => {
    try {
      const data = insertTestSchema.parse(req.body);
      const test = await storage.createTest(data);
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create test" });
    }
  });

  app.put("/api/tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertTestSchema.parse(req.body);
      const test = await storage.updateTest(id, data);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update test" });
    }
  });

  app.delete("/api/tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTest(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete test" });
    }
  });

  // API routes for test suites
  app.get("/api/test-suites", async (req, res) => {
    try {
      const testSuites = await storage.getAllTestSuites();
      res.json(testSuites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test suites" });
    }
  });

  app.get("/api/test-suites/status", async (req, res) => {
    try {
      const testSuiteStatus = await storage.getTestSuitesStatus();
      res.json(testSuiteStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test suite status" });
    }
  });

  // API routes for test executions
  app.get("/api/test-executions", async (req, res) => {
    try {
      const executions = await storage.getAllTestExecutions();
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test executions" });
    }
  });

  app.get("/api/test-executions/recent", async (req, res) => {
    try {
      const recentExecutions = await storage.getRecentTestExecutions();
      res.json(recentExecutions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent test executions" });
    }
  });

  app.post("/api/test-executions/run/:testId", async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const test = await storage.getTest(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Run the test and create execution record
      try {
        await recorder.playTest(test);
        const executionData = {
          testId,
          testName: test.name,
          browser: test.browser,
          status: "passed",
          duration: "2m 15s", // Mock duration for now
          logs: [],
          screenshots: []
        };
        
        const execution = await storage.createTestExecution(executionData);
        
        // Update the test with last execution info
        await storage.updateTest(testId, {
          ...test,
          lastStatus: "passed",
          lastRun: new Date().toISOString()
        });
        
        res.status(200).json(execution);
      } catch (error) {
        // If test execution fails, record it as failed
        const executionData = {
          testId,
          testName: test.name,
          browser: test.browser,
          status: "failed",
          duration: "0m 45s", // Mock duration for now
          logs: [{ error: error instanceof Error ? error.message : "Unknown error" }],
          screenshots: []
        };
        
        const execution = await storage.createTestExecution(executionData);
        
        // Update the test with last execution info
        await storage.updateTest(testId, {
          ...test,
          lastStatus: "failed",
          lastRun: new Date().toISOString()
        });
        
        // We still return 200 because the execution was recorded successfully
        res.status(200).json(execution);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to run test" });
    }
  });

  // API routes for dashboard metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // API routes for reports
  app.get("/api/reports/summary", async (req, res) => {
    try {
      const summary = await storage.getReportSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report summary" });
    }
  });

  // API routes for recorder
  app.post("/api/recorder/start", async (req, res) => {
    try {
      const schema = z.object({
        testName: z.string().min(1),
        targetUrl: z.string().url(),
        browser: z.string()
      });
      
      const data = schema.parse(req.body);
      await recorder.startRecording(data);
      res.status(200).json({ message: "Recording started" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to start recording" });
    }
  });

  app.post("/api/recorder/stop", async (req, res) => {
    try {
      await recorder.stopRecording();
      res.status(200).json({ message: "Recording stopped" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop recording" });
    }
  });

  app.get("/api/recorder/steps", async (req, res) => {
    try {
      const steps = await recorder.getRecordedSteps();
      res.status(200).json({ steps });
    } catch (error) {
      res.status(500).json({ message: "Failed to get recorded steps" });
    }
  });

  app.post("/api/recorder/play", async (req, res) => {
    try {
      const schema = z.object({
        testName: z.string().min(1),
        browser: z.string(),
        steps: z.array(z.string())
      });
      
      const data = schema.parse(req.body);
      await recorder.playRecording(data);
      res.status(200).json({ message: "Recording played successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to play recording" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
