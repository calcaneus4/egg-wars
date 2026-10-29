// Headless smoke test: loads index.html over file://, runs the game for a few seconds,
// simulates clicks, and fails on any console error or page error.
// Usage: node tools/smoke-test.js [seconds]
// Needs Playwright (global install is fine: NODE_PATH=$(npm root -g)).
"use strict";

const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const seconds = Number(process.argv[2] || 6);
  const executablePath = process.env.CHROMIUM_PATH || undefined;
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(String(err && err.stack || err)));
  const url = "file://" + path.resolve(__dirname, "..", "index.html");
  await page.goto(url);
  await page.waitForTimeout(500);
  // Leave the title screen through its PLAY/CONTINUE button.
  await page.evaluate(() => Menus.buttons[0].action());
  await page.waitForTimeout(200);
  const box = await page.locator("canvas").boundingBox();
  for (let i = 0; i < seconds * 2; i++) {
    await page.mouse.click(box.x + box.width * (0.2 + 0.6 * Math.random()), box.y + box.height * 0.5);
    await page.waitForTimeout(500);
  }
  if (process.env.SMOKE_EVAL) console.log(await page.evaluate(process.env.SMOKE_EVAL));
  if (process.env.SMOKE_SCREENSHOT) await page.screenshot({ path: process.env.SMOKE_SCREENSHOT });
  await browser.close();
  if (errors.length) {
    console.error("SMOKE TEST FAILED:\n" + errors.join("\n"));
    process.exit(1);
  }
  console.log(`SMOKE TEST OK (${seconds}s, no console errors)`);
})().catch((err) => { console.error(err); process.exit(1); });
