import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GoogleIdentityButton } from "./GoogleIdentityButton";

const { renderGoogleSignInButtonMock } = vi.hoisted(() => ({
  renderGoogleSignInButtonMock: vi.fn<
    typeof import("./googleIdentity").renderGoogleSignInButton
  >(),
}));

vi.mock("./googleIdentity", async () => {
  const actual = await vi.importActual<typeof import("./googleIdentity")>(
    "./googleIdentity",
  );
  return {
    ...actual,
    renderGoogleSignInButton: renderGoogleSignInButtonMock,
  };
});

describe("GoogleIdentityButton", () => {
  it("does not reinitialize GIS button on parent rerender when clientId and disabled stay unchanged", async () => {
    renderGoogleSignInButtonMock.mockReset().mockResolvedValue(undefined);

    const firstOnSuccess = vi.fn();
    const secondOnSuccess = vi.fn();
    const onUnavailable = vi.fn();

    const { rerender } = render(
      <GoogleIdentityButton
        clientId="google-client-id"
        onSuccess={firstOnSuccess}
        onUnavailable={onUnavailable}
      />,
    );

    await waitFor(() =>
      expect(renderGoogleSignInButtonMock.mock.calls.length).toBeGreaterThan(0),
    );
    const initialRenderCount = renderGoogleSignInButtonMock.mock.calls.length;

    rerender(
      <GoogleIdentityButton
        clientId="google-client-id"
        onSuccess={secondOnSuccess}
        onUnavailable={onUnavailable}
      />,
    );

    expect(renderGoogleSignInButtonMock).toHaveBeenCalledTimes(initialRenderCount);
  });
});
