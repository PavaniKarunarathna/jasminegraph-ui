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

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Auth from "../../../../../Frontend/src/app/auth/page";
import * as authService from "../../../../../Frontend/src/services/auth-service";
import * as userService from "../../../../../Frontend/src/services/user-service";
import { useRouter } from "next/navigation";

// Mock next/router's useRouter
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../../../../Frontend/src/services/auth-service");
jest.mock("../../../../../Frontend/src/services/user-service");

// Mock components
jest.mock("../../../../../Frontend/src/components/auth/Loading", () => ({
  __esModule: true,
  default: () => <div>Loading...</div>,
}));

jest.mock("../../../../../Frontend/src/components/auth/login-form", () => ({
  __esModule: true,
  default: () => <div>Login Form</div>,
}));

// Mock antd
jest.mock("antd", () => ({
  message: {
    error: jest.fn(),
  },
  Alert: ({ message, action, onClose }: any) => (
    <div data-testid="alert">
      <div>{message}</div>
      {action}
      <button onClick={onClose} aria-label="close">
        ×
      </button>
    </div>
  ),
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}), { virtual: true });

describe("Auth Component", () => {
  let pushMock: jest.Mock;
  const mockedCheckBackendHealth =
    authService.checkBackendHealth as jest.MockedFunction<
      typeof authService.checkBackendHealth
    >;
  const mockedGetAllUsers = userService.getAllUsers as jest.MockedFunction<
    typeof userService.getAllUsers
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });

    mockedCheckBackendHealth.mockResolvedValue(true);
    mockedGetAllUsers.mockResolvedValue({
      data: [{ id: 1, name: "User1" }],
    });
  });

  test("renders login screen when backend is healthy", async () => {
    render(<Auth />);

    await waitFor(() => {
      expect(screen.getByText(/JasmineGraph/i)).toBeInTheDocument();
      expect(screen.getByText("Login Form")).toBeInTheDocument();
    });
  });

  test("shows alert if no users exist and navigates to setup on button click", async () => {
    mockedGetAllUsers.mockResolvedValue({ data: [] });

    render(<Auth />);

    const alert = await screen.findByTestId("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/Admin User Not Found/i)).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /go to setup/i });
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith("/setup");
  });

  test("displays error message on getAllUsers failure", async () => {
    const errorMock = jest.fn();
    require("antd").message.error = errorMock;

    mockedGetAllUsers.mockRejectedValue(new Error("Backend error"));

    render(<Auth />);

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith("Failed to ping backend");
    });
  });
});
