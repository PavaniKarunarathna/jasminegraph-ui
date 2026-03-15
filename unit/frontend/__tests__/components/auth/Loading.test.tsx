/**
Copyright 2026 JasmineGraph Team
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Loading from "../../../../../Frontend/src/components/auth/Loading";

const mockGet = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, "customElements", {
    value: { get: mockGet },
    configurable: true,
  });
});

describe("Loading Component", () => {
  it("renders loading text", () => {
    render(<Loading />);

    expect(screen.getByText("Loading JasmineGraph...")).toBeInTheDocument();
  });

  it("renders dotlottie-player element", () => {
    render(<Loading />);

    const player = document.querySelector("dotlottie-player");
    expect(player).toBeInTheDocument();
  });

  it("renders dotlottie-player with correct attributes", () => {
    render(<Loading />);

    const player = document.querySelector("dotlottie-player") as HTMLElement;
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute(
      "src",
      "https://assets-v2.lottiefiles.com/a/a5723f98-1150-11ee-a173-9f8a35d72636/ABw3dcRyMl.lottie"
    );
    expect(player).toHaveAttribute("background", "transparent");
    expect(player).toHaveAttribute("speed", "1");
    expect(player.getAttribute("loop")).not.toBeNull();
    expect(player.getAttribute("autoplay")).not.toBeNull();
    expect(player).toHaveStyle({ width: "600px", height: "600px" });
  });

  it("renders loading text with correct styles", () => {
    render(<Loading />);

    const loadingText = screen.getByText("Loading JasmineGraph...");
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveStyle({
      color: "#000",
      fontSize: "24px",
      fontWeight: "600",
      marginTop: "20px",
    });
  });

  it("renders container with correct styles", () => {
    render(<Loading />);

    const container = screen.getByText("Loading JasmineGraph...").parentElement;
    expect(container).toHaveStyle({
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    });
  });

  it("loads dotlottie script when custom element is not registered", async () => {
    mockGet.mockReturnValue(null);
    const createElementSpy = jest.spyOn(document, "createElement");
    const appendChildSpy = jest.spyOn(document.body, "appendChild");

    render(<Loading />);

    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith("script");
      const appended = appendChildSpy.mock.calls.find(
        (call) => (call[0] as HTMLElement)?.tagName === "SCRIPT"
      )?.[0] as HTMLScriptElement | undefined;
      expect(appended).toBeDefined();
      expect(appended?.src).toBe(
        "https://cdn.jsdelivr.net/npm/@dotlottie/player-component@latest/dist/dotlottie-player.js"
      );
      expect(appended?.async).toBe(true);
    });
  });

  it("does not load script when custom element is already registered", () => {
    mockGet.mockReturnValue({});
    const createElementSpy = jest.spyOn(document, "createElement");
    const appendChildSpy = jest.spyOn(document.body, "appendChild");

    render(<Loading />);

    expect(createElementSpy).not.toHaveBeenCalledWith("script");
    const appendedScript = appendChildSpy.mock.calls.find(
      (call) => (call[0] as HTMLElement)?.tagName === "SCRIPT"
    );
    expect(appendedScript).toBeUndefined();
  });

  it("renders consistently across renders", () => {
    const { rerender } = render(<Loading />);

    expect(screen.getByText("Loading JasmineGraph...")).toBeInTheDocument();

    rerender(<Loading />);

    expect(screen.getByText("Loading JasmineGraph...")).toBeInTheDocument();
    expect(screen.getAllByText("Loading JasmineGraph...")).toHaveLength(1);
  });

  it("has proper accessibility structure", () => {
    render(<Loading />);

    const loadingText = screen.getByText("Loading JasmineGraph...");
    expect(loadingText).toBeVisible();
    expect(loadingText.tagName).toBe("P");
  });
});
