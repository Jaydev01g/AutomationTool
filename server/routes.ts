import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocket, WebSocketServer } from "ws";
import { startBrowser, stopBrowser, recordActions, playbackTest } from "./puppeteer";
import { z } from "zod";
import { insertTestSchema, insertTestSuiteSchema, insertTestStepSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time communication
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/recording/ws',
    // Allow all origins
    verifyClient: (info) => {
      return true;
    }
  });
  
  console.log("WebSocket server initialized at /api/recording/ws");
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws, req) => {
    console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);
    clients.add(ws);
    
    // Send a welcome message to confirm connection
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to recording server'
    }));
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  // Broadcast to all clients
  const broadcast = (message: any) => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };
  
  // Test Suites API
  app.get('/api/test-suites', async (req, res) => {
    const suites = await storage.getTestSuites();
    res.json(suites);
  });
  
  app.post('/api/test-suites', async (req, res) => {
    try {
      const data = insertTestSuiteSchema.parse(req.body);
      const suite = await storage.createTestSuite(data);
      res.status(201).json(suite);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });
  
  app.get('/api/test-suites/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    const suite = await storage.getTestSuite(id);
    if (!suite) {
      return res.status(404).json({ message: 'Test suite not found' });
    }
    
    res.json(suite);
  });
  
  // Tests API
  app.get('/api/tests', async (req, res) => {
    const tests = await storage.getTests();
    res.json(tests);
  });
  
  app.post('/api/tests', async (req, res) => {
    try {
      const data = insertTestSchema.parse(req.body);
      const test = await storage.createTest(data);
      
      // Create steps if provided
      if (req.body.steps && Array.isArray(req.body.steps)) {
        for (const step of req.body.steps) {
          await storage.createTestStep({
            ...step,
            testId: test.id
          });
        }
      }
      
      const testWithSteps = await storage.getTest(test.id);
      res.status(201).json(testWithSteps);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });
  
  app.get('/api/tests/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    const test = await storage.getTest(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    res.json(test);
  });
  
  app.patch('/api/tests/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    const test = await storage.updateTest(id, req.body);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    res.json(test);
  });
  
  // Test Steps API
  app.post('/api/tests/:testId/steps', async (req, res) => {
    const testId = parseInt(req.params.testId);
    if (isNaN(testId)) {
      return res.status(400).json({ message: 'Invalid test ID' });
    }
    
    try {
      const data = {
        ...req.body,
        testId
      };
      
      const step = await storage.createTestStep(data);
      res.status(201).json(step);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });
  
  app.patch('/api/tests/:testId/steps/:stepId', async (req, res) => {
    const testId = parseInt(req.params.testId);
    const stepId = parseInt(req.params.stepId);
    
    if (isNaN(testId) || isNaN(stepId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    const step = await storage.updateTestStep(stepId, req.body);
    if (!step) {
      return res.status(404).json({ message: 'Test step not found' });
    }
    
    res.json(step);
  });
  
  app.delete('/api/tests/:testId/steps/:stepId', async (req, res) => {
    const stepId = parseInt(req.params.stepId);
    
    if (isNaN(stepId)) {
      return res.status(400).json({ message: 'Invalid step ID' });
    }
    
    await storage.deleteTestStep(stepId);
    res.status(204).send();
  });
  
  app.delete('/api/tests/:testId/steps', async (req, res) => {
    const testId = parseInt(req.params.testId);
    
    if (isNaN(testId)) {
      return res.status(400).json({ message: 'Invalid test ID' });
    }
    
    await storage.deleteAllTestSteps(testId);
    res.status(204).send();
  });
  
  app.post('/api/tests/:testId/steps/reorder', async (req, res) => {
    const testId = parseInt(req.params.testId);
    
    if (isNaN(testId)) {
      return res.status(400).json({ message: 'Invalid test ID' });
    }
    
    if (!req.body.steps || !Array.isArray(req.body.steps)) {
      return res.status(400).json({ message: 'Steps array is required' });
    }
    
    try {
      await storage.reorderTestSteps(req.body.steps);
      const test = await storage.getTest(testId);
      res.json(test);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });
  
  // Test Execution API
  app.post('/api/tests/:id/run', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    const test = await storage.getTest(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    try {
      // Run the test with Puppeteer
      const results = await playbackTest(test);
      
      // Update test with last run data
      await storage.updateTest(id, {
        lastRun: new Date().toISOString(),
        lastStatus: results.failed > 0 ? 'failed' : 'passed'
      });
      
      // Save results
      await storage.createTestResult({
        runId: 0, // Single test run
        testId: id,
        passed: results.passed,
        failed: results.failed,
        duration: results.duration,
        steps: results.steps,
        error: results.error,
      });
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: 'Error running test' });
    }
  });
  
  // Test Runs API
  app.post('/api/test-runs', async (req, res) => {
    const testIds = req.body.testIds;
    
    if (!Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({ message: 'Test IDs array is required' });
    }
    
    try {
      // Create a new test run
      const run = await storage.createTestRun({
        status: 'running',
        totalTests: testIds.length
      });
      
      // Start test execution in background
      setTimeout(async () => {
        let passedTests = 0;
        let failedTests = 0;
        
        for (const testId of testIds) {
          try {
            const test = await storage.getTest(testId);
            
            if (test) {
              // Run the test
              const results = await playbackTest(test);
              
              // Save results
              await storage.createTestResult({
                runId: run.id,
                testId,
                passed: results.passed,
                failed: results.failed,
                duration: results.duration,
                steps: results.steps,
                error: results.error,
              });
              
              // Update test last run data
              await storage.updateTest(testId, {
                lastRun: new Date().toISOString(),
                lastStatus: results.failed > 0 ? 'failed' : 'passed'
              });
              
              // Update counters
              if (results.failed > 0) {
                failedTests++;
              } else {
                passedTests++;
              }
            }
          } catch (error) {
            failedTests++;
          }
          
          // Update run progress
          await storage.updateTestRun(run.id, {
            completedTests: passedTests + failedTests,
            passedTests,
            failedTests
          });
          
          // Broadcast progress update
          const updatedRun = await storage.getTestRun(run.id);
          broadcast({ type: 'runUpdate', data: updatedRun });
        }
        
        // Complete the run
        await storage.updateTestRun(run.id, {
          status: 'completed',
          endTime: new Date().toISOString(),
          completedTests: passedTests + failedTests,
          passedTests,
          failedTests
        });
        
        // Broadcast completion
        const finalRun = await storage.getTestRun(run.id);
        broadcast({ type: 'runComplete', data: finalRun });
      }, 0);
      
      res.status(201).json(run);
    } catch (error) {
      res.status(500).json({ message: 'Error starting test run' });
    }
  });
  
  app.get('/api/test-runs/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    
    const run = await storage.getTestRun(id);
    if (!run) {
      return res.status(404).json({ message: 'Test run not found' });
    }
    
    res.json(run);
  });
  
  // Recording API
  app.post('/api/recording/start', async (req, res) => {
    try {
      await startBrowser();
      
      // Start recording actions
      recordActions((action) => {
        // Broadcast recorded action to all clients
        broadcast({ type: 'action', description: action.description, step: action.step });
      });
      
      res.json({ success: true, message: 'Recording started' });
    } catch (error) {
      res.status(500).json({ message: 'Error starting recording' });
    }
  });
  
  app.post('/api/recording/stop', async (req, res) => {
    try {
      await stopBrowser();
      res.json({ success: true, message: 'Recording stopped' });
    } catch (error) {
      res.status(500).json({ message: 'Error stopping recording' });
    }
  });
  
  // Dashboard API
  app.get('/api/dashboard', async (req, res) => {
    try {
      const totalTests = await storage.getTotalTests();
      const successRate = await storage.getSuccessRate();
      const executionsToday = await storage.getExecutionsCountToday();
      const testsByDay = await storage.getTestRunsByDay();
      
      res.json({
        totalTests,
        successRate,
        executionsToday,
        testsByDay
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching dashboard data' });
    }
  });
  
  // Recent Tests API
  app.get('/api/tests/recent', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 5;
    
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: 'Invalid limit' });
    }
    
    const recentTests = await storage.getRecentTests(limit);
    res.json(recentTests);
  });
  
  // Test Run Results API
  app.get('/api/test-runs/recent', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: 'Invalid limit' });
    }
    
    const recentRuns = await storage.getRecentTestRuns(limit);
    res.json(recentRuns);
  });
  
  // Reports API
  app.get('/api/reports/summary', async (req, res) => {
    try {
      const totalRuns = await storage.getTotalTestRuns();
      const passed = await storage.getTotalPassedTests();
      const failed = await storage.getTotalFailedTests();
      const successRate = passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
      const avgDuration = await storage.getAverageTestDuration();
      const trendData = await storage.getSuccessRateTrend();
      
      res.json({
        totalRuns,
        passed,
        failed,
        successRate,
        avgDuration,
        trendData
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching report summary' });
    }
  });
  
  // Settings API
  app.get('/api/settings/:key', async (req, res) => {
    const key = req.params.key;
    const setting = await storage.getSetting(key);
    
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    res.json(setting.value);
  });
  
  app.post('/api/settings/:key', async (req, res) => {
    const key = req.params.key;
    
    try {
      const setting = await storage.createOrUpdateSetting(key, req.body);
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: 'Invalid setting value' });
    }
  });

  return httpServer;
}
