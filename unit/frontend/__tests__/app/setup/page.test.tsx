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
import { render, screen } from '@testing-library/react';
import SetupPage from '../../../../../Frontend/src/app/setup/page';

jest.mock('../../../../../Frontend/src/components/setup/welcome-screen', () => ({
  __esModule: true,
  default: ({ onSuccess }: any) => <div>Welcome Screen</div>,
}));

jest.mock('../../../../../Frontend/src/components/setup/admin-profile', () => ({
  __esModule: true,
  default: ({ onSuccess }: any) => <div>Admin Profile</div>,
}));

jest.mock('../../../../../Frontend/src/components/setup/cluster-profile', () => ({
  __esModule: true,
  default: ({ onSuccess }: any) => <div>Cluster Setup</div>,
}));

jest.mock('../../../../../Frontend/src/components/setup/last-step', () => ({
  __esModule: true,
  default: () => <div>Finish Step</div>,
}));

jest.mock(
  'antd',
  () => ({
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    Steps: ({ items, current }: any) => (
      <div data-testid="steps">
        {items?.map((item: any, index: number) => (
          <div key={item.key} data-current={index === current}>
            {item.title}
          </div>
        ))}
      </div>
    ),
    message: { success: jest.fn(), error: jest.fn() },
    theme: {
      useToken: () => ({
        token: {
          colorTextTertiary: '#000',
          colorFillAlter: '#f5f5f5',
          borderRadiusLG: '8px',
          colorBorder: '#d9d9d9',
        },
      }),
    },
  }),
  { virtual: true }
);

describe('SetupPage', () => {
  it('renders setup wizard steps', () => {
    render(<SetupPage />);

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Admin Profile')).toBeInTheDocument();
    expect(screen.getByText('Cluster Setup')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('displays welcome screen as first step', () => {
    render(<SetupPage />);

    expect(screen.getByText('Welcome Screen')).toBeInTheDocument();
  });

  it('renders steps component', () => {
    render(<SetupPage />);

    expect(screen.getByTestId('steps')).toBeInTheDocument();
  });
});
