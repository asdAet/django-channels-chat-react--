import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dispatchDeviceMediaChanges,
  installDeviceEnvironment,
  resetDeviceEnvironment,
  updateDeviceEnvironment,
} from "../../test/deviceEnvironment";
import { DeviceProvider } from "../lib/device";
import { MobileShellProvider, useMobileShell } from "./useMobileShell";

function resizeToMobile() {
  updateDeviceEnvironment({
    viewportWidth: 390,
    viewportHeight: 844,
    coarsePointer: true,
    canHover: false,
    maxTouchPoints: 5,
  });

  act(() => {
    dispatchDeviceMediaChanges();
  });
}

function resizeToDesktop() {
  updateDeviceEnvironment({ viewportWidth: 1280, viewportHeight: 720 });

  act(() => {
    dispatchDeviceMediaChanges();
  });
}

function Probe({ onMount }: { onMount: () => void }) {
  const { isDrawerOpen, isMobileViewport, openDrawer } = useMobileShell();

  useEffect(() => {
    onMount();
  }, [onMount]);

  return (
    <div
      data-drawer-open={String(isDrawerOpen)}
      data-mobile={String(isMobileViewport)}
      data-testid="mobile-shell-probe"
    >
      <button onClick={openDrawer} type="button">
        open
      </button>
    </div>
  );
}

function renderMobileShellProbe(onMount: () => void) {
  return render(
    <DeviceProvider>
      <MobileShellProvider>
        <Probe onMount={onMount} />
      </MobileShellProvider>
    </DeviceProvider>,
  );
}

describe("MobileShellProvider", () => {
  afterEach(() => {
    resetDeviceEnvironment();
    vi.restoreAllMocks();
  });

  it("switches between desktop and mobile without remounting children", () => {
    installDeviceEnvironment({ viewportWidth: 1280, viewportHeight: 720 });
    const onMount = vi.fn();
    renderMobileShellProbe(onMount);

    expect(onMount).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mobile-shell-probe")).toHaveAttribute(
      "data-mobile",
      "false",
    );

    resizeToMobile();

    expect(onMount).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mobile-shell-probe")).toHaveAttribute(
      "data-mobile",
      "true",
    );
  });

  it("closes the mobile drawer when returning to desktop mode", () => {
    installDeviceEnvironment({
      viewportWidth: 390,
      viewportHeight: 844,
      coarsePointer: true,
      canHover: false,
      maxTouchPoints: 5,
    });
    const onMount = vi.fn();
    renderMobileShellProbe(onMount);

    fireEvent.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByTestId("mobile-shell-probe")).toHaveAttribute(
      "data-drawer-open",
      "true",
    );

    resizeToDesktop();

    expect(screen.getByTestId("mobile-shell-probe")).toHaveAttribute(
      "data-drawer-open",
      "false",
    );

    resizeToMobile();

    expect(screen.getByTestId("mobile-shell-probe")).toHaveAttribute(
      "data-drawer-open",
      "false",
    );
    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
