import { chromium } from "playwright";
const browser = await chromium.launch();
const DIR = "/private/tmp/claude-501/-Users-muhammed-Documents-thartheel/fe8471a0-d610-4379-a090-d2beb6d2cd24/scratchpad/mobile-audit";
const BASE = "http://localhost:3000";
const VIEWPORT = { width: 390, height: 844 };

async function shot(page, path, name, fullPage = true) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage });
  console.log("captured", name);
}

async function login(page, loginPath, expectedPath, email, password) {
  page.setDefaultTimeout(45000);
  await page.goto(`${BASE}${loginPath}`, { waitUntil: "networkidle" });
  await page.fill("#identifier", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 30000 });
}

let page = await browser.newPage({ viewport: VIEWPORT });
await login(page, "/login/staff", "/admin", "corex.official.sa@gmail.com", "THRTHL3223!");
await shot(page, "/admin", "05-admin-home");
await shot(page, "/admin/registrations/student", "06-admin-reg-student");
await shot(page, "/admin/registrations/teacher", "07-admin-reg-teacher");
await shot(page, "/admin/growth", "08-admin-growth");
await shot(page, "/admin/visit-reports", "09-admin-visit-reports");

let page2 = await browser.newPage({ viewport: VIEWPORT });
await login(page2, "/login/staff", "/board", "corex.official.sa+board@gmail.com", "BRD8PRTL3223!");
await shot(page2, "/board", "10-board-home");
await shot(page2, "/board/teachers", "11-board-teachers");
await shot(page2, "/board/students", "12-board-students");
await shot(page2, "/board/finance", "13-board-finance");

let page3 = await browser.newPage({ viewport: VIEWPORT });
await login(page3, "/login/staff", "/finance", "corex.official.sa+finance@gmail.com", "FNNC83223!");
await shot(page3, "/finance", "14-finance-home");
await shot(page3, "/finance/ledger", "15-finance-ledger");

await browser.close();
console.log("DONE");
