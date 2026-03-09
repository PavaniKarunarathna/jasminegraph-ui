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
import { render, screen } from "@testing-library/react";
import Instance from "../../../../../../../Frontend/src/app/clusters/[id]/instance/page";

jest.mock("antd", () => {
  const Input = ({ children }: any) => <div>{children}</div>;
  Input.TextArea = ({ children }: any) => <textarea>{children}</textarea>;
  
  return {
    Table: ({ columns }: any) => (
      <div>
        <table>
          <thead>
            <tr>
              {columns?.map((col: any) => (
                <th key={col.key}>{col.title}</th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
    ),
    Tag: ({ children }: any) => <span>{children}</span>,
    Row: ({ children }: any) => <div>{children}</div>,
    Col: ({ children }: any) => <div>{children}</div>,
    Input,
    Descriptions: ({ items }: any) => <div>{items?.map((i: any) => <div key={i.key}>{i.label}</div>)}</div>,
  };
}, { virtual: true });

describe("Instance Page", () => {
  it("renders node details heading", () => {
    render(<Instance params={{ id: "123" }} />);

    expect(screen.getByText("Node Details")).toBeInTheDocument();
  });

  it("displays node table with key columns", () => {
    render(<Instance params={{ id: "123" }} />);

    expect(screen.getByText("NodeID")).toBeInTheDocument();
    expect(screen.getByText("IP Address")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });
});
