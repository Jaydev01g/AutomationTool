let currentTabId = null;

document.getElementById("startBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;
  const testName = document.getElementById("testName").value || "Untitled";
  chrome.tabs.sendMessage(tab.id, { type: "START_RECORDING", testName }, (res) => {
    document.getElementById("status").textContent = "Recording started!";
  });
};

document.getElementById("stopBtn").onclick = async () => {
  if (!currentTabId) return;
  chrome.tabs.sendMessage(currentTabId, { type: "STOP_RECORDING" }, async (res) => {
    document.getElementById("status").textContent = "Uploading...";
    // Send steps to your backend
    await fetch("http://localhost:5501/api/recorder/steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testName: res.testName, steps: res.steps }),
    });
    document.getElementById("status").textContent = "Uploaded!";
  });
};