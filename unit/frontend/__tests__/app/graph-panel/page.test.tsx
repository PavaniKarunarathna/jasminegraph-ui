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
import GraphUpload from "../../../../../Frontend/src/app/graph-panel/page";

jest.mock("../../../../../Frontend/src/hooks/useActivity", () => ({
  useActivity: () => ({
    reportErrorFromException: jest.fn(),
  }),
}));

jest.mock("../../../../../Frontend/src/components/graph-panel/kafka-upload-modal", () => ({
  __esModule: true,
  default: () => <div>Kafka Upload Modal</div>,
}));

jest.mock("../../../../../Frontend/src/components/graph-panel/hadoop-upload-modal", () => ({
  __esModule: true,
  default: () => <div>Hadoop Upload Modal</div>,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: any) => <img alt={alt} />,
}));

jest.mock(
  "antd",
  () => {
    const Upload = ({ children }: any) => <div>{children}</div>;
    Upload.Dragger = ({ children }: any) => <div data-testid="upload-dragger">{children}</div>;

    const Typography: any = ({ children }: any) => <div>{children}</div>;
    Typography.Title = ({ children }: any) => <h4>{children}</h4>;

    return {
      Upload,
      Typography,
      Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
      Divider: ({ children }: any) => <div>{children}</div>,
      Modal: ({ open, children, title }: any) =>
        open ? (
          <div>
            <div>{title}</div>
            {children}
          </div>
        ) : null,
      Input: ({ value, onChange }: any) => <input value={value} onChange={onChange} />,
      message: { success: jest.fn(), error: jest.fn() },
      Row: ({ children }: any) => <div>{children}</div>,
      Col: ({ children }: any) => <div>{children}</div>,
    };
  },
  { virtual: true }
);

describe("Graph Upload Page", () => {
  it("renders upload heading", () => {
    render(<GraphUpload />);

    expect(screen.getByText("Upload Graph Data:")).toBeInTheDocument();
  });

  it("displays file dragger component", () => {
    render(<GraphUpload />);

    expect(screen.getByTestId("upload-dragger")).toBeInTheDocument();
    expect(screen.getByText(/Click or drag file to this area to upload/i)).toBeInTheDocument();
  });

  it("shows upload button", () => {
    render(<GraphUpload />);

    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });
});
