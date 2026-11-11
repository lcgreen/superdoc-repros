// Serves the page with Vite, opens it in headless Chromium, and waits for the document to paint.
import { chromium } from "playwright";
import { createServer } from "vite";

export const MOD = process.platform === "darwin" ? "Meta" : "Control";

export async function open(doc, { mode = "suggesting" } = {}) {
  const server = await createServer({ root: new URL("..", import.meta.url).pathname, logLevel: "error", server: { port: 0 } });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
  await page.goto(`${url}?doc=${doc}&mode=${mode}`);
  await page.waitForFunction(() => window.ready && document.querySelectorAll(".superdoc-page .superdoc-text-run").length > 0, null, { timeout: 120_000 });
  const exceptions = () => page.evaluate(() => window.exceptions);
  const close = async () => { await browser.close(); await server.close(); };
  return { page, exceptions, close };
}

/** The painted run whose text contains `text`, as a centre point and box. */
export async function run(page, text) {
  const box = await page.evaluate((needle) => {
    const el = [...document.querySelectorAll(".superdoc-page .superdoc-text-run")].find((r) => r.textContent.includes(needle));
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { left: b.left, right: b.right, y: b.top + b.height / 2, width: b.width };
  }, text);
  if (!box) throw new Error(`no painted run contains ${JSON.stringify(text)}`);
  return box;
}

export async function report(title, expected, exceptions) {
  const { readFileSync } = await import("node:fs");
  const version = JSON.parse(readFileSync(new URL("../node_modules/superdoc/package.json", import.meta.url))).version;
  console.log(`\n${title}  (superdoc ${version})`);
  console.log(`  expected: ${expected}`);
  console.log(exceptions.length ? `  actual:   ${exceptions.length} exception(s)\n${[...new Set(exceptions)].map((e) => `    - ${e}`).join("\n")}` : "  actual:   no exception");
  return exceptions.length;
}
