// Suggesting mode, a long document: type, wait, undo, wait, redo. No speed involved.
// DOC=plain (five paragraphs) and MODE=editing are the controls: neither raises anything.
import { MOD, open, report, run } from "./harness.mjs";

const { page, exceptions, close } = await open(process.env.DOC ?? "long-document", { mode: process.env.MODE ?? "suggesting" });
const target = await run(page, "2. The Tenant");
await page.mouse.click(target.left + 40, target.y);
await page.keyboard.type("smoke one ");
await page.waitForTimeout(1000);
await page.keyboard.press(`${MOD}+z`);
await page.waitForTimeout(1000);
await page.keyboard.press(`${MOD}+Shift+z`);
await page.waitForTimeout(2000);
const shown = await page.evaluate(() => document.querySelector("#editor").textContent.includes("smoke one"));
const failed = await report("Redo of an undone tracked insertion", "typed text restored, no exception", await exceptions());
console.log(`  page shows the redone text: ${shown}`);
await close();
process.exit(failed ? 1 : 0);
