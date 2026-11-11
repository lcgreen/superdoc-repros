// diff.capture() then diff.compare() against that snapshot, after one edit, on a table with tracked row deletions.
import { open, report, run } from "./harness.mjs";

const { page, exceptions, close } = await open("deleted-rows");
const result = await page.evaluate(async () => {
  const diff = window.sd.activeEditor?.doc?.diff;
  if (!diff?.capture || !diff?.compare) return { error: "doc.diff API not found on activeEditor" };
  try {
    const baseline = await diff.capture();
    return { baseline: true, snapshot: baseline };
  } catch (error) {
    return { error: `capture: ${error.message}` };
  }
});
let outcome = result.error ?? "";
if (!result.error) {
  const target = await run(page, "A plain paragraph before");
  await page.mouse.click(target.left + 40, target.y);
  await page.keyboard.type("edit ");
  await page.waitForTimeout(800);
  outcome = await page.evaluate(async (baseline) => {
    try {
      const comparison = await window.sd.activeEditor.doc.diff.compare({ targetSnapshot: baseline });
      return `ok: ${JSON.stringify(comparison.summary)}`;
    } catch (error) {
      return `compare threw: ${error.message}`;
    }
  }, result.snapshot);
}
const engine = await exceptions();
const failed = await report("diff.compare on a table with tracked row deletions", "a comparison result", outcome.startsWith("ok") ? engine : [outcome, ...engine]);
if (outcome.startsWith("ok")) console.log(`  ${outcome.slice(0, 300)}`);
await close();
process.exit(failed ? 1 : 0);
