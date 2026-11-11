// Drag a selection from plain text onto a tracked deletion of a field.
import { open, report, run } from "./harness.mjs";

const { page, exceptions, close } = await open("deleted-field");
const from = await run(page, "one plain line");
const to = await run(page, "the redline removed");
await page.mouse.move(from.left + 3, from.y);
await page.mouse.down();
await page.mouse.move(to.right - 3, to.y, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(800);
const failed = await report("Drag-select onto a tracked deletion of a field", "selection extends into the deleted entry, no exception", await exceptions());
await close();
process.exit(failed ? 1 : 0);
