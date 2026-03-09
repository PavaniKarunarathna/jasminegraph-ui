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
import GraphExtract from "../../../../../../Frontend/src/app/graph-panel/extract/page";

jest.mock("lru-cache", () => ({
  LRUCache: class {
    static Status = {
      FETCH: 'FETCH',
      MISS: 'MISS',
      HIT: 'HIT'
    };
  }
}), { virtual: true });

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}), { virtual: true });

jest.mock("../../../../../../Frontend/src/redux/hook", () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ 
    uploadBytes: [],
    updates: []
  }),
}));

jest.mock("../../../../../../Frontend/src/hooks/useActivity", () => ({
  useActivity: () => ({
    reportError: jest.fn(),
    reportErrorFromException: jest.fn(),
  }),
}));

jest.mock("../../../../../../Frontend/src/services/graph-service", () => ({
  getKGConstructionMetaData: jest.fn(),
  getOnProgressKGConstructionMetaData: jest.fn(),
  stopConstructKG: jest.fn(),
  deleteGraph: jest.fn(),
}));

jest.mock(
  "react-use-websocket",
  () => ({
    __esModule: true,
    default: () => ({
      sendJsonMessage: jest.fn(),
      lastJsonMessage: null,
      readyState: 1,
    }),
    ReadyState: {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
      UNINSTANTIATED: -1,
    },
  }),
  { virtual: true }
);

jest.mock("../../../../../../Frontend/src/components/graph-panel/kafka-upload-modal", () => ({
  __esModule: true,
  default: () => <div>Kafka Upload Modal</div>,
}));

jest.mock("../../../../../../Frontend/src/components/extract-panel/hadoop-extract-modal", () => ({
  __esModule: true,
  default: () => <div>Hadoop Extract Modal</div>,
}));

jest.mock("../../../../../../Frontend/src/components/extract-panel/hadoop-kg-form", () => ({
  __esModule: true,
  default: () => <div>Hadoop KG Form</div>,
}));

jest.mock("../../../../../../Frontend/src/components/extract-panel/kg-form", () => ({
  __esModule: true,
  default: () => <div>KG Form</div>,
}));

jest.mock("../../../../../../Frontend/src/components/extract-panel/progress-bar", () => ({
  __esModule: true,
  default: () => <div>Progress Bar</div>,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: any) => <img alt={alt} />,
}));

jest.mock(
  "antd",
  () => {
    const Upload = ({ children }: any) => <div>{children}</div>;
    Upload.Dragger = ({ children }: any) => <div data-testid="extract-dragger">{children}</div>;

    const Typography: any = ({ children }: any) => <div>{children}</div>;
    Typography.Title = ({ children }: any) => <h1>{children}</h1>;
    Typography.Text = ({ children }: any) => <span>{children}</span>;

    const Input: any = ({ value, onChange }: any) => <input value={value} onChange={onChange} />;
    Input.Search = ({ placeholder }: any) => <input placeholder={placeholder} />;

    return {
      Upload,
      Typography,
      Input,
      Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
      Divider: ({ children }: any) => <div>{children}</div>,
      Modal: ({ open, children }: any) => (open ? <div>{children}</div> : null),
      Card: ({ children }: any) => <div>{children}</div>,
      message: { success: jest.fn(), error: jest.fn() },
      Spin: ({ children }: any) => <div>{children}</div>,
      Row: ({ children }: any) => <div>{children}</div>,
      Col: ({ children }: any) => <div>{children}</div>,
    };
  },
  { virtual: true }
);

describe("Graph Extract Page", () => {
  it("renders extract heading", () => {
    render(<GraphExtract />);

    expect(screen.getByText("Extract Graph Data:")).toBeInTheDocument();
  });

  it("displays upload dragger", () => {
    render(<GraphExtract />);

    expect(screen.getByTestId("extract-dragger")).toBeInTheDocument();
  });

  it("shows upload button", () => {
    render(<GraphExtract />);

    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });
});
