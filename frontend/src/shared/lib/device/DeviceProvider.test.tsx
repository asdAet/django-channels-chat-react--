import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dispatchDeviceMediaChanges,
  installDeviceEnvironment,
  resetDeviceEnvironment,
  updateDeviceEnvironment,
} from "../../../test/deviceEnvironment";
import { DeviceProvider } from "./DeviceProvider";
import { useDevice } from "./useDevice";

describe("DeviceProvider", () => {
  afterEach(() => {
    resetDeviceEnvironment();
    vi.restoreAllMocks();
  });

  function Probe() {
    const { isMobileViewport, viewportWidth } = useDevice();
    return (
      <p data-testid="device-snapshot">
        {String(isMobileViewport)}:{viewportWidth}
      </p>
    );
  }

  it("does not rerender consumers when resize keeps the same device traits", async () => {
    installDeviceEnvironment({ viewportWidth: 1280 });

    render(
      <DeviceProvider>
        <Probe />
      </DeviceProvider>,
    );

    expect(screen.getByTestId("device-snapshot")).toHaveTextContent(
      "false:1280",
    );

    updateDeviceEnvironment({ viewportWidth: 1024 });

    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByTestId("device-snapshot")).toHaveTextContent(
      "false:1280",
    );
  });

  it("rerenders consumers when resize changes the device mode", async () => {
    installDeviceEnvironment({ viewportWidth: 1280 });

    render(
      <DeviceProvider>
        <Probe />
      </DeviceProvider>,
    );

    expect(screen.getByTestId("device-snapshot")).toHaveTextContent(
      "false:1280",
    );

    updateDeviceEnvironment({
      viewportWidth: 390,
      viewportHeight: 844,
      coarsePointer: true,
      canHover: false,
      maxTouchPoints: 5,
    });

    await act(async () => {
      dispatchDeviceMediaChanges();
    });

    expect(screen.getByTestId("device-snapshot")).toHaveTextContent("true:390");
  });
});
