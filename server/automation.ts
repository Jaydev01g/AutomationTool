import express from "express";
import fs from "fs/promises"; // Simulating a database with a file
import { Builder, By } from "selenium-webdriver";

const router = express.Router();

router.post("/run-script", async (req, res) => {
  const { actions } = req.body;

  if (!actions || !Array.isArray(actions)) {
    return res.status(400).json({ error: "Invalid actions provided" });
  }

  let driver;
  const results = [];

  try {
    // Initialize the Selenium WebDriver
    driver = await new Builder().forBrowser("chrome").build();

    for (const action of actions) {
      const actionType = action.type.toLowerCase();
      try {
        if (actionType === "navigate") {
          if (!action.url) {
            throw new Error("Navigate action requires a 'url' field.");
          }
          await driver.get(action.url); // Navigate to the URL
        } else if (actionType === "click") {
          if (!action.selector) {
            throw new Error("Click action requires a 'selector' field.");
          }
          const element = await driver.findElement(By.css(action.selector));
          await element.click(); // Click the element
        } else if (actionType === "input") {
          if (!action.selector || !action.value) {
            throw new Error("Input action requires 'selector' and 'value' fields.");
          }
          const inputElement = await driver.findElement(By.css(action.selector));
          await inputElement.sendKeys(action.value); // Type the value into the input field
        } else if (actionType === "check") {
          if (!action.selector) {
            throw new Error("Check action requires a 'selector' field.");
          }
          const checkbox = await driver.findElement(By.css(action.selector));
          const isChecked = await checkbox.isSelected();
          if (!isChecked) {
            await checkbox.click(); // Check the checkbox if not already checked
          }
        } else if (actionType === "screenshot") {
          if (!action.value) {
            throw new Error("Screenshot action requires a 'value' field for the file path.");
          }
          const screenshot = await driver.takeScreenshot();
          await fs.writeFile(action.value, screenshot, "base64"); // Save the screenshot
        } else {
          throw new Error(`Unsupported action type: ${action.type}`);
        }

        // Add a delay between actions for better visibility
        await new Promise((resolve) => setTimeout(resolve, 1000));

        results.push({ success: true });
      } catch (error) {
        console.error(`Error executing action: ${action.type}`, error);
        results.push({ success: false, error: (error as Error).message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error executing script:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
  } finally {
    if (driver) {
      await driver.quit(); // Close the browser
    }
  }
});

router.post("/save-steps", async (req, res) => {
  const { actions } = req.body;

  if (!actions || !Array.isArray(actions)) {
    return res.status(400).json({ error: "Invalid actions provided" });
  }

  try {
    // Save actions to a file (simulating a database)
    await fs.writeFile("saved-steps.json", JSON.stringify(actions, null, 2));
    res.json({ success: true, message: "Steps saved successfully." });
  } catch (error) {
    console.error("Error saving steps:", error);
    res.status(500).json({ error: "Failed to save steps." });
  }
});

router.get("/load-steps", async (req, res) => {
  try {
    // Read actions from a file (simulating a database)
    const data = await fs.readFile("saved-steps.json", "utf-8");
    const actions = JSON.parse(data);
    res.json({ success: true, actions });
  } catch (error) {
    console.error("Error loading steps:", error);
    res.status(500).json({ error: "Failed to load steps." });
  }
});

export default router;