// Add debug log to confirm script is loaded
console.log("[NoCodeTester] content.js loaded");

let isRecording = false;
let recordedSteps = [];
let testName = "";

function getSelector(el) {
  if (el.id) return "#" + el.id;
  if (el.className) return el.tagName + "." + el.className.split(" ").join(".");
  return el.tagName;
}

function recordAction(type, event, extra = {}) {
  if (!isRecording) return;
  const target = event?.target || null;
  const selector = target ? getSelector(target) : extra.selector || undefined;
  let value = undefined;
  if (type === "input") value = target.value;
  if (type === "select") value = target.value;
  if (type === "clear") value = null;
  if (type === "keydown") value = event.key;
  if (type === "wait") value = extra.ms;
  if (type === "assert") value = extra.assertion;
  if (type === "switchToWindow" || type === "switchToFrame") value = extra.target;
  if (type === "screenshot") value = extra.name;
  recordedSteps.push({ type, selector, value, timestamp: Date.now(), ...extra });
  console.log(`[NoCodeTester] Recorded: ${type}, selector: ${selector}, value:`, value, extra);
}

// Floating panel injection logic
function injectRecordingPanel() {
  if (document.getElementById('nocode-tester-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'nocode-tester-panel';
  panel.style.position = 'fixed';
  panel.style.bottom = '24px';
  panel.style.right = '24px';
  panel.style.zIndex = '99999';
  panel.style.background = '#222';
  panel.style.color = '#fff';
  panel.style.padding = '12px 18px';
  panel.style.borderRadius = '8px';
  panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  panel.style.fontFamily = 'sans-serif';
  panel.innerHTML = `
    <div style="margin-bottom:8px;font-weight:bold;">NoCodeTester Recording</div>
    <button id="nocode-tester-stop" style="background:#e74c3c;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Stop & Save</button>
    <button id="nocode-tester-screenshot" style="background:#2980b9;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-left:8px;">Screenshot</button>
    <button id="nocode-tester-wait" style="background:#16a085;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-left:8px;">Wait</button>
    <button id="nocode-tester-assert" style="background:#8e44ad;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-left:8px;">Assert</button>
    <button id="nocode-tester-switch-window" style="background:#f39c12;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-left:8px;">Switch Window</button>
    <button id="nocode-tester-switch-frame" style="background:#d35400;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;margin-left:8px;">Switch Frame</button>
  `;
  document.body.appendChild(panel);
  document.getElementById('nocode-tester-stop').onclick = async () => {
    isRecording = false;
    panel.innerHTML = '<span>Uploading...</span>';
    // Send steps to backend
    try {
      const resp = await fetch('http://localhost:5501/api/recorder/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testName, steps: recordedSteps })
      });
      if (resp.ok) {
        panel.innerHTML = '<span>Uploaded!</span>';
        setTimeout(() => panel.remove(), 1500);
      } else {
        panel.innerHTML = '<span style="color:#e74c3c">Upload failed</span>';
      }
    } catch (e) {
      panel.innerHTML = '<span style="color:#e74c3c">Error uploading</span>';
    }
  };
  document.getElementById('nocode-tester-screenshot').onclick = () => {
    const name = prompt('Screenshot name (optional):') || undefined;
    recordAction('screenshot', {}, { name });
  };
  document.getElementById('nocode-tester-wait').onclick = () => {
    const ms = parseInt(prompt('Wait time in ms:', '1000'), 10);
    if (!isNaN(ms)) recordAction('wait', {}, { ms });
  };
  document.getElementById('nocode-tester-assert').onclick = () => {
    const assertion = prompt('Assertion (e.g., selector exists, text equals, etc):');
    if (assertion) recordAction('assert', {}, { assertion });
  };
  document.getElementById('nocode-tester-switch-window').onclick = () => {
    const target = prompt('Window handle or index to switch to:');
    if (target) recordAction('switchToWindow', {}, { target });
  };
  document.getElementById('nocode-tester-switch-frame').onclick = () => {
    const target = prompt('Frame selector or index to switch to:');
    if (target) recordAction('switchToFrame', {}, { target });
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "START_RECORDING") {
    isRecording = true;
    recordedSteps = [];
    testName = msg.testName || "";
    injectRecordingPanel(); // Show floating panel
    sendResponse({ status: "recording" });
  }
  if (msg.type === "STOP_RECORDING") {
    isRecording = false;
    sendResponse({ status: "stopped", steps: recordedSteps, testName });
  }
});

document.addEventListener("click", (e) => recordAction("click", e));
document.addEventListener("dblclick", (e) => recordAction("doubleClick", e));
document.addEventListener("contextmenu", (e) => recordAction("rightClick", e));
document.addEventListener("mouseover", (e) => recordAction("mouseOver", e));
document.addEventListener("dragstart", (e) => recordAction("dragStart", e));
document.addEventListener("drop", (e) => recordAction("drop", e));
document.addEventListener("input", (e) => recordAction("input", e));
document.addEventListener("change", (e) => {
  if (e.target && e.target.tagName === 'SELECT') recordAction("select", e);
});
document.addEventListener("keydown", (e) => recordAction("keydown", e));
document.addEventListener("submit", (e) => recordAction("submit", e));