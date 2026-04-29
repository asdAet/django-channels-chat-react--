import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");
const TOKENS_FILE = join(SRC_ROOT, "styles", "tokens.css");
const COLOR_LITERAL_PATTERN =
  /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;

const collectCssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const file = join(dir, entry);
    const stats = statSync(file);
    if (stats.isDirectory()) return collectCssFiles(file);
    if (!stats.isFile() || !file.endsWith(".css")) return [];
    return [file];
  });

describe("style color tokens", () => {
  it("keeps color literals centralized in tokens.css", () => {
    const offenders = collectCssFiles(SRC_ROOT)
      .filter((file) => file !== TOKENS_FILE)
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        return Array.from(source.matchAll(COLOR_LITERAL_PATTERN)).map(
          (match) => `${relative(process.cwd(), file)}: ${match[0]}`,
        );
      });

    expect(offenders).toEqual([]);
  });
});
