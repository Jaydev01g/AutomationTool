import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Test Suite schema
export const testSuites = pgTable("test_suites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestSuiteSchema = createInsertSchema(testSuites).pick({
  name: true,
});

// Test schema
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  suiteId: integer("suite_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastRun: timestamp("last_run"),
  lastStatus: text("last_status"),
});

export const insertTestSchema = createInsertSchema(tests).pick({
  name: true,
  suiteId: true,
});

// Test Step schema
export const testSteps = pgTable("test_steps", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  type: text("type").notNull(), // navigate, click, type, verify, wait, scroll
  order: integer("order").notNull(),
  selector: text("selector"),
  text: text("text"),
  url: text("url"),
  condition: text("condition"), // exists, visible, contains, value
  duration: integer("duration"), // for wait steps
  direction: text("direction"), // for scroll steps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestStepSchema = createInsertSchema(testSteps).pick({
  testId: true,
  type: true,
  order: true,
  selector: true,
  text: true,
  url: true,
  condition: true,
  duration: true,
  direction: true,
});

// Test Run schema
export const testRuns = pgTable("test_runs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull(), // running, completed, failed
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  totalTests: integer("total_tests").notNull(),
  completedTests: integer("completed_tests").default(0).notNull(),
  passedTests: integer("passed_tests").default(0).notNull(),
  failedTests: integer("failed_tests").default(0).notNull(),
});

export const insertTestRunSchema = createInsertSchema(testRuns).pick({
  status: true,
  totalTests: true,
});

// Test Run Results schema
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull(),
  testId: integer("test_id").notNull(),
  passed: integer("passed").notNull(),
  failed: integer("failed").notNull(),
  duration: integer("duration").notNull(), // in milliseconds
  steps: jsonb("steps").notNull(), // array of step results
  error: jsonb("error"), // error details if any
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestResultSchema = createInsertSchema(testResults).pick({
  runId: true,
  testId: true,
  passed: true,
  failed: true,
  duration: true,
  steps: true,
  error: true,
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

// Export types
export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = z.infer<typeof insertTestSuiteSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type TestStep = typeof testSteps.$inferSelect;
export type InsertTestStep = z.infer<typeof insertTestStepSchema>;

export type TestRun = typeof testRuns.$inferSelect;
export type InsertTestRun = z.infer<typeof insertTestRunSchema>;

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
