import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const playwrightCliPath = require.resolve("@playwright/test/cli");
const installNames = ["chromium", "webkit"];

console.warn(
  `[ensure-playwright-browsers] Ensuring Playwright browsers: ${installNames.join(
    " ",
  )}.`,
);

execFileSync(process.execPath, [playwrightCliPath, "install", ...installNames], {
  stdio: "inherit",
});
