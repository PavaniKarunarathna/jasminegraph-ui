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

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AccessManagement from "../../../../../../../Frontend/src/app/clusters/[id]/access-management/page";
import { getCluster, addUserToCluster, removeUserFromCluster } from "../../../../../../../Frontend/src/services/cluster-service";
import { getAllUsers } from "../../../../../../../Frontend/src/services/user-service";
import { useAppSelector } from "../../../../../../../Frontend/src/redux/hook";

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}), { virtual: true });

jest.mock("../../../../../../../Frontend/src/redux/hook", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("../../../../../../../Frontend/src/services/cluster-service", () => ({
  getCluster: jest.fn(),
  addUserToCluster: jest.fn(),
  removeUserFromCluster: jest.fn(),
}));

jest.mock("../../../../../../../Frontend/src/services/user-service", () => ({
  getAllUsers: jest.fn(),
}));

jest.mock("../../../../../../../Frontend/src/hooks/useAccessToken", () => ({
  __esModule: true,
  default: () => ({
    getSrvAccessToken: () => "token",
  }),
}));

jest.mock("antd", () => {
  return {
    Table: ({ columns, dataSource }: any) => (
      <div>
        <table>
          <thead>
            <tr>
              {columns?.map((col: any) => (
                <th key={col.key}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataSource?.map((row: any) => (
              <tr key={row.key}>
                <td>{row.Name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    Tag: ({ children }: any) => <span>{children}</span>,
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    AutoComplete: ({ placeholder, children }: any) => (
      <div>
        <div>{placeholder}</div>
        {children}
      </div>
    ),
    Input: ({ children }: any) => <div>{children}</div>,
    Space: ({ children }: any) => <div>{children}</div>,
  };
}, { virtual: true });

// Add Input.Search component
const antd = require("antd");
antd.Input.Search = ({ placeholder }: any) => <input placeholder={placeholder} aria-label="search-input" />;

describe("Access Management Page", () => {
  const mockedUseAppSelector = useAppSelector as jest.Mock;
  const mockedGetCluster = getCluster as jest.MockedFunction<typeof getCluster>;
  const mockedGetAllUsers = getAllUsers as jest.MockedFunction<typeof getAllUsers>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseAppSelector.mockImplementation((selector: any) =>
      selector({
        authData: { userData: { id: "1", email: "admin@test.com", role: "admin" } },
        clusterData: { selectedCluster: null },
        cacheData: { users: [] },
      })
    );

    mockedGetCluster.mockResolvedValue({
      data: {
        id: "123",
        cluster_owner: "1",
        user_ids: ["2"],
      },
    } as any);

    mockedGetAllUsers.mockResolvedValue({
      data: [
        { id: "1", firstName: "Admin", lastName: "User", email: "admin@test.com", role: "admin", enabled: true },
        { id: "2", firstName: "Test", lastName: "User", email: "test@test.com", role: "user", enabled: true },
      ],
    } as any);
  });

  it("renders user management header and description", async () => {
    render(<AccessManagement params={{ id: "123" }} />);

    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText(/role-based access control/i)).toBeInTheDocument();
  });

  it("displays user table with columns", async () => {
    render(<AccessManagement params={{ id: "123" }} />);

    await waitFor(() => {
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Role")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });
  });

  it("shows search input for admin users", async () => {
    render(<AccessManagement params={{ id: "123" }} />);

    await waitFor(() => {
      expect(screen.getByLabelText("search-input")).toBeInTheDocument();
    });
  });
});
