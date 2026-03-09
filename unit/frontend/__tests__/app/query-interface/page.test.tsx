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

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import QueryInterfacePage from '../../../../../Frontend/src/app/query-interface/page';
import { getGraphList } from '../../../../../Frontend/src/services/graph-service';

jest.mock('../../../../../Frontend/src/services/graph-service', () => ({
  getGraphList: jest.fn(),
}));

jest.mock('../../../../../Frontend/src/redux/hook', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: () => ({ messagePool: {} }),
}));

jest.mock('../../../../../Frontend/src/hooks/useActivity', () => ({
  useActivity: () => ({
    reportErrorFromException: jest.fn(),
  }),
}));

jest.mock(
  'react-use-websocket',
  () => ({
    __esModule: true,
    default: () => ({
      sendJsonMessage: jest.fn(),
      lastJsonMessage: null,
      readyState: 1,
      getWebSocket: jest.fn(),
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

jest.mock('../../../../../Frontend/src/components/visualization/query-visualization', () => ({
  __esModule: true,
  default: () => <div>Query Visualization</div>,
}));

jest.mock(
  'antd',
  () => {
    const Input: any = ({ placeholder, onChange }: any) => (
      <input placeholder={placeholder} onChange={onChange} />
    );
    Input.TextArea = ({ placeholder, onChange }: any) => (
      <textarea placeholder={placeholder} onChange={onChange} />
    );

    return {
      Input,
      Select: ({ placeholder, options, onChange }: any) => (
        <select onChange={onChange} aria-label={placeholder}>
          {options?.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ),
      Table: ({ dataSource }: any) => <div>Table with {dataSource?.length || 0} rows</div>,
      Tabs: ({ items }: any) => (
        <div>
          {items?.map((item: any) => (
            <div key={item.key}>{item.label}</div>
          ))}
        </div>
      ),
      message: { error: jest.fn() },
    };
  },
  { virtual: true }
);

describe('QueryInterfacePage', () => {
  const mockedGetGraphList = getGraphList as jest.MockedFunction<typeof getGraphList>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetGraphList.mockResolvedValue({ data: [] } as any);
  });

  it('fetches graph list on mount', async () => {
    render(<QueryInterfacePage />);

    await waitFor(() => {
      expect(mockedGetGraphList).toHaveBeenCalled();
    });
  });

  it('displays graph selector', async () => {
    render(<QueryInterfacePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/graph/i)).toBeInTheDocument();
    });
  });

  it('displays query textarea', async () => {
    render(<QueryInterfacePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/query/i)).toBeInTheDocument();
    });
  });
});
