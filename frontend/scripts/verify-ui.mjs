import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const outputDir = resolve(process.cwd(), "..", "docs", "screenshots");
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "vi-VN",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("response", (response) => {
  if (response.status() >= 500)
    errors.push(`http ${response.status()}: ${response.url()}`);
});

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.screenshot({
  path: resolve(outputDir, "login-desktop.png"),
  fullPage: true,
});
await page.getByLabel("Email").fill("admin@solar.local");
await page.getByLabel("Mật khẩu").fill("Admin@123");
await page.getByRole("button", { name: "Đăng nhập" }).click();
await page.waitForURL("**/dashboard");
await page.getByRole("heading", { name: "Dashboard" }).waitFor();
await page.getByText("Tổng sản phẩm").waitFor();
await page.screenshot({
  path: resolve(outputDir, "dashboard-desktop.png"),
  fullPage: true,
});

const routes = [
  "products",
  "categories",
  "suppliers",
  "warehouses",
  "inventory",
  "stock-receipts",
  "stock-issues",
  "stock-checks",
  "projects",
  "inventory-transactions",
  "reports",
  "users",
];
for (const route of routes) {
  const response = await page.goto(`http://localhost:3000/${route}`, {
    waitUntil: "networkidle",
  });
  if (!response?.ok())
    throw new Error(`Trang /${route} trả HTTP ${response?.status()}.`);
  if (page.url().includes("/login"))
    throw new Error(`Trang /${route} bị chuyển về login.`);
  await page.locator("main h1").waitFor();
}

await page.goto("http://localhost:3000/stock-receipts", {
  waitUntil: "networkidle",
});
await page.getByRole("button", { name: /Lập phiếu nhập/ }).click();
await page.getByRole("heading", { name: "Lập phiếu nhập kho" }).waitFor();
await page.screenshot({
  path: resolve(outputDir, "stock-receipt-form.png"),
  fullPage: true,
});
await page.keyboard.press("Escape");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:3000/dashboard", {
  waitUntil: "networkidle",
});
await page.getByRole("button", { name: "Mở menu" }).click();
await page.getByRole("link", { name: "Lịch sử giao dịch" }).last().waitFor();
await page.screenshot({
  path: resolve(outputDir, "dashboard-mobile-menu.png"),
  fullPage: true,
});

await browser.close();
if (errors.length) throw new Error(`UI có lỗi runtime:\n${errors.join("\n")}`);
console.log(
  JSON.stringify(
    {
      status: "PASS",
      checkedRoutes: routes.length + 2,
      screenshots: [
        "login-desktop.png",
        "dashboard-desktop.png",
        "stock-receipt-form.png",
        "dashboard-mobile-menu.png",
      ],
    },
    null,
    2,
  ),
);
