import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  avatarUrl: true,
});

// Test cases table
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  targetUrl: text("target_url").notNull(),
  browser: text("browser").notNull(),
  steps: jsonb("steps").notNull(),
  lastStatus: text("last_status"),
  lastRun: text("last_run"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTestSchema = createInsertSchema(tests).pick({
  name: true,
  description: true,
  targetUrl: true,
  browser: true,
  steps: true,
  userId: true,
});

// Test suites table
export const testSuites = pgTable("test_suites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  testIds: jsonb("test_ids").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTestSuiteSchema = createInsertSchema(testSuites).pick({
  name: true,
  description: true,
  testIds: true,
  userId: true,
});

// Test executions table
export const testExecutions = pgTable("test_executions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id"),
  testName: text("test_name").notNull(),
  browser: text("browser").notNull(),
  status: text("status").notNull(),
  duration: text("duration").notNull(),
  logs: jsonb("logs"),
  screenshots: jsonb("screenshots"),
  userId: integer("user_id"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export const insertTestExecutionSchema = createInsertSchema(testExecutions).pick({
  testId: true,
  testName: true,
  browser: true,
  status: true,
  duration: true,
  logs: true,
  screenshots: true,
  userId: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type TestSuite = typeof testSuites.$inferSelect & {
  testCount: number;
  successRate: number;
  lastRun: string;
};
export type InsertTestSuite = z.infer<typeof insertTestSuiteSchema>;

export type TestExecution = typeof testExecutions.$inferSelect & {
  lastRun?: string;
};
export type InsertTestExecution = z.infer<typeof insertTestExecutionSchema>;

// Additional types for API responses
export type TestSuiteStatus = {
  id: number;
  name: string;
  successRate: number;
  passed: number;
  failed: number;
  lastRun: string;
};

export type DashboardMetrics = {
  testCases: number;
  testCasesTrend: number;
  successRate: number;
  successRateTrend: number;
  failedTests: number;
  failedTestsTrend: number;
  avgExecutionTime: number;
  executionTimeTrend: number;
};

export type ReportSummary = {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  failRate: number;
  avgDuration: string;
};
