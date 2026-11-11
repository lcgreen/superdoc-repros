// Type, then undo / redo / undo without waiting for each render.
// GAP_MS=700 is the control: the same keys, slowly, raise nothing.
import { MOD, open, report, run } from "./harness.mjs";

const { page, exceptions, close } = await open(process.env.DOC ?? "long-document", { mode: process.env.MODE ?? "editing" });
const target = await run(page, "2. The Tenant");
await page.mouse.click(target.left + 40, target.y);
await page.keyboard.type("smoke one ");
await page.waitForTimeout(800);
const sequence = (process.env.SEQ ?? "ururuu").split("").map((c) => (c === "u" ? "undo" : "redo"));
for (const direction of sequence) {
  await page.keyboard.press(direction === "undo" ? `${MOD}+z` : `${MOD}+Shift+z`);
  await page.waitForTimeout(Number(process.env.GAP_MS ?? 0));
}
await page.waitForTimeout(2500);
const shown = await page.evaluate(() => document.querySelector("#editor").textContent.includes("smoke one"));
const failed = await report("Undo, redo, undo in quick succession", "typed text undone, no exception", await exceptions());
console.log(`  page still shows the undone text: ${shown}`);
await close();
process.exit(failed ? 1 : 0);
