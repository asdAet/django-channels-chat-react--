import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const nativePackageByPlatform = {
  "darwin:arm64": "@rollup/rollup-darwin-arm64",
  "darwin:x64": "@rollup/rollup-darwin-x64",
  "linux:arm64": "@rollup/rollup-linux-arm64-gnu",
  "linux:x64": "@rollup/rollup-linux-x64-gnu",
  "win32:arm64": "@rollup/rollup-win32-arm64-msvc",
  "win32:ia32": "@rollup/rollup-win32-ia32-msvc",
  "win32:x64": "@rollup/rollup-win32-x64-msvc",
};

const platformKey = `${process.platform}:${process.arch}`;
const nativePackageName = nativePackageByPlatform[platformKey];

if (!nativePackageName) {
  process.exit(0);
}

let rollupVersion;
try {
  rollupVersion = require("rollup/package.json").version;
} catch {
  process.exit(0);
}

try {
  require.resolve(`${nativePackageName}/package.json`);
  process.exit(0);
} catch {
  // npm can omit Rollup's platform package when node_modules is reused across
  // OSes or optional dependencies were skipped. Install the exact Rollup native
  // package without changing package.json/package-lock.json.
}

const npmExecPath = process.env.npm_execpath;
const npmCommand =
  npmExecPath && existsSync(npmExecPath)
    ? {
        executable: process.execPath,
        argsPrefix: [npmExecPath],
        options: {},
      }
    : {
        executable: "npm",
        argsPrefix: [],
        options: {
          shell: process.platform === "win32",
        },
      };

console.warn(
  `[ensure-rollup-native] Missing ${nativePackageName}; installing ${nativePackageName}@${rollupVersion}.`,
);

execFileSync(
  npmCommand.executable,
  [
    ...npmCommand.argsPrefix,
    "install",
    "--no-save",
    "--no-package-lock",
    "--include=optional",
    `${nativePackageName}@${rollupVersion}`,
  ],
  {
    stdio: "inherit",
    ...npmCommand.options,
  },
);
