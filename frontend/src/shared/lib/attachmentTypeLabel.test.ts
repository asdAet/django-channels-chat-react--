import { describe, expect, it } from "vitest";

import { resolveAttachmentTypeLabel } from "./attachmentTypeLabel";

describe("resolveAttachmentTypeLabel", () => {
  it("prefers file extension when it exists", () => {
    expect(
      resolveAttachmentTypeLabel(
        "application/x-compressed",
        "zapret-discord-youtube-1.9.3.rar",
      ),
    ).toBe("rar");
    expect(
      resolveAttachmentTypeLabel(
        "application/octet-stream",
        "nocubes_better_fletching_table_1.0.1_forge_1.20.1.jar",
      ),
    ).toBe("jar");
    expect(
      resolveAttachmentTypeLabel(
        "application/x-zip-compressed",
        "eatinganimations+ 1.10.zip",
      ),
    ).toBe("zip");
  });

  it("falls back to mime aliases when extension is absent", () => {
    expect(resolveAttachmentTypeLabel("application/x-zip-compressed", "file")).toBe(
      "zip",
    );
    expect(resolveAttachmentTypeLabel("application/vnd.rar", "file")).toBe(
      "rar",
    );
  });

  it("returns bin as safe fallback", () => {
    expect(resolveAttachmentTypeLabel("", "no_extension")).toBe("bin");
    expect(resolveAttachmentTypeLabel(null, null)).toBe("bin");
  });
});
