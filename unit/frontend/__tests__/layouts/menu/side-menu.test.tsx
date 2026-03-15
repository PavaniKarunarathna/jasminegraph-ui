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

const mockGetSideMenuData = jest.fn();
const mockUsePathname = jest.fn();
const mockRouter = { push: jest.fn() };

jest.mock(
  'antd',
  () => {
    const React = require('react');
    const Sider = ({ children, collapsed, onCollapse }: any) => (
      <div data-testid="mock-sider" data-collapsed={String(collapsed)}>
        <button onClick={() => onCollapse?.(!collapsed)}>toggle</button>
        {children}
      </div>
    );
    const Menu = ({ items, selectedKeys }: any) => (
      <div data-testid="mock-menu" data-selected-keys={JSON.stringify(selectedKeys)}>
        {(items || []).map((item: any) => (
          <span key={String(item.key)}>{String(item.label)}</span>
        ))}
      </div>
    );
    return {
      Layout: { Sider },
      Menu,
      theme: {
        useToken: () => ({ token: { colorBgContainer: '#fff', borderRadiusLG: 4 } }),
      },
    };
  },
  { virtual: true }
);

jest.mock('@/data/side-menu-data', () => ({
  getSideMenuData: (...args: any[]) => mockGetSideMenuData(...args),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => mockRouter,
}));

jest.mock('@/redux/hook', () => ({
  useAppSelector: (selector: any) => selector({ authData: { userData: { role: 'admin' } } }),
}));

import SideMenu from '../../../../../Frontend/src/layouts/menu/side-menu';

describe('SideMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/clusters');
    mockGetSideMenuData.mockReturnValue([
      { key: '/', label: 'Database Information' },
      { key: '/clusters', label: 'Clusters' },
      { key: '/logs', label: 'Logs' },
    ]);
  });

  it('renders menu items from getSideMenuData', () => {
    render(<SideMenu />);

    expect(screen.getByText('Database Information')).toBeInTheDocument();
    expect(screen.getByText('Clusters')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(mockGetSideMenuData).toHaveBeenCalledWith(mockRouter, 'admin');
  });

  it('sets selected menu key based on current pathname', () => {
    render(<SideMenu />);

    expect(screen.getByTestId('mock-menu').getAttribute('data-selected-keys')).toBe(
      JSON.stringify(['/clusters'])
    );
  });

  it('auto-collapses on logs route', async () => {
    mockUsePathname.mockReturnValue('/logs');
    render(<SideMenu />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-sider').getAttribute('data-collapsed')).toBe('true');
    });
  });
});
