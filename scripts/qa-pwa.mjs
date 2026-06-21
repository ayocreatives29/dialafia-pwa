import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = process.env.QA_URL || 'http://127.0.0.1:4174/';
const desktopScreenshot = path.join(process.cwd(), 'qa-desktop.png');
const iphoneScreenshot = path.join(process.cwd(), 'qa-ios.png');
const profileDir = path.join(os.tmpdir(), `dialafia-chrome-${Date.now()}`);
const port = 9223;

async function waitForVersion() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return response.json();
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for Chrome DevTools endpoint');
}

async function waitForPageTarget() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    if (response.ok) {
      const targets = await response.json();
      const page = targets.find((target) => target.type === 'page');
      if (page?.webSocketDebuggerUrl) return page;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for Chrome page target');
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data.toString());
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      const listeners = this.events.get(message.method) || [];
      for (const listener of listeners) listener(message.params);
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  once(method, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      const listener = (params) => {
        clearTimeout(timer);
        this.events.set(method, (this.events.get(method) || []).filter((item) => item !== listener));
        resolve(params);
      };
      this.events.set(method, [...(this.events.get(method) || []), listener]);
    });
  }

  close() {
    this.ws.close();
  }
}

async function checkPage(client, config) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: config.width,
    height: config.height,
    deviceScaleFactor: config.deviceScaleFactor,
    mobile: config.mobile,
  });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: config.mobile });
  await client.send('Network.setUserAgentOverride', {
    userAgent: config.userAgent,
    platform: config.platform,
  });
  const loaded = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url: baseUrl });
  await loaded;
  await client.send('Runtime.evaluate', {
    expression: 'new Promise((resolve) => setTimeout(resolve, 1000))',
    awaitPromise: true,
  });
  const bodyText = await client.send('Runtime.evaluate', {
    expression: 'document.body.innerText',
    returnByValue: true,
  });
  const manifestHref = await client.send('Runtime.evaluate', {
    expression: 'document.querySelector("link[rel=\\"manifest\\"]")?.getAttribute("href") || null',
    returnByValue: true,
  });
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  await writeFile(config.screenshot, Buffer.from(screenshot.data, 'base64'));
  return {
    viewport: config.label,
    hasDiaLafia: bodyText.result.value.includes('DiaLafia'),
    hasManifestLink: Boolean(manifestHref.result.value),
    hasIOSPrompt: bodyText.result.value.includes('On iPhone, tap Share in Safari, then Add to Home Screen.'),
    savedScreenshot: config.screenshot,
  };
}

await mkdir(profileDir, { recursive: true });

const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'ignore'], windowsHide: true },
);

try {
  await waitForVersion();
  const pageTarget = await waitForPageTarget();
  const client = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await client.open();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');

  const results = [];
  results.push(await checkPage(client, {
    label: 'desktop 1366x900',
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    platform: 'Win32',
    screenshot: desktopScreenshot,
  }));
  results.push(await checkPage(client, {
    label: 'iPhone Safari 390x844',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    screenshot: iphoneScreenshot,
  }));
  client.close();
  console.log(JSON.stringify(results, null, 2));
} finally {
  chrome.kill();
  await new Promise((resolve) => chrome.once('exit', resolve));
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }).catch(() => {});
}
