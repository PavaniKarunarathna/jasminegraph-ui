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
import UserManagementPage from '../../../../../Frontend/src/app/user-management/page';
import { getAllUsers } from '../../../../../Frontend/src/services/user-service';

jest.mock('../../../../../Frontend/src/services/user-service', () => ({
  getAllUsers: jest.fn(),
}));

jest.mock('../../../../../Frontend/src/redux/hook', () => ({
  useAppSelector: jest.fn(() => ({
    users: [],
    state: { isUsersCacheLoaded: false },
  })),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
}), { virtual: true });

jest.mock('../../../../../Frontend/src/hooks/useActivity', () => ({
  useActivity: () => ({
    reportErrorFromException: jest.fn(),
  }),
}));

jest.mock('../../../../../Frontend/src/layouts/page-wrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../../../../Frontend/src/components/cluster-details/user-registration-form', () => ({
  __esModule: true,
  default: ({ onSuccess }: any) => <div>User Registration Form</div>,
}));

jest.mock('../../../../../Frontend/src/components/common/ActivityPanel', () => ({
  __esModule: true,
  default: ({ featureName }: any) => <div>Activity Panel</div>,
}));

jest.mock('react-highlight-words', () => ({
  __esModule: true,
  default: ({ children }: any) => <span>{children}</span>,
}), { virtual: true });

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock(
  'antd',
  () => {
    const Layout: any = ({ children, style }: any) => <div style={style}>{children}</div>;
    Layout.Content = ({ children, style }: any) => <div style={style}>{children}</div>;

    return {
      Layout,
      Button: ({ children, onClick, size }: any) => (
        <button onClick={onClick}>{children}</button>
      ),
      Modal: ({ open, children, title }: any) =>
        open ? (
          <div>
            <div>{title}</div>
            {children}
          </div>
        ) : null,
      Table: ({ columns, dataSource }: any) => (
        <div data-testid="users-table">
          Table with {dataSource?.length || 0} users
        </div>
      ),
      Input: ({ placeholder, value, onChange }: any) => (
        <input placeholder={placeholder} value={value} onChange={onChange} />
      ),
      Space: ({ children }: any) => <div>{children}</div>,
      Tag: ({ children, color }: any) => <span style={{ color }}>{children}</span>,
      Form: {
        useForm: () => [{ resetFields: jest.fn() }],
      },
      message: { error: jest.fn(), success: jest.fn() },
      theme: {
        useToken: () => ({
          token: {
            colorBgContainer: '#ffffff',
            borderRadiusLG: '8px',
          },
        }),
      },
    };
  },
  { virtual: true }
);

describe('UserManagementPage', () => {
  const mockedGetAllUsers = getAllUsers as jest.MockedFunction<typeof getAllUsers>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAllUsers.mockResolvedValue({ data: [] } as any);
  });

  it('renders user management page correctly', async () => {
    render(<UserManagementPage />);

    expect(screen.getByText(/user management/i)).toBeInTheDocument();
  });

  it('displays users table', async () => {
    render(<UserManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId('users-table')).toBeInTheDocument();
    });
  });

  it('shows add new user button', async () => {
    render(<UserManagementPage />);

    expect(screen.getByRole('button', { name: /add new user/i })).toBeInTheDocument();
  });

  it('fetches users on mount', async () => {
    render(<UserManagementPage />);

    await waitFor(() => {
      expect(mockedGetAllUsers).toHaveBeenCalled();
    });
  });
});
