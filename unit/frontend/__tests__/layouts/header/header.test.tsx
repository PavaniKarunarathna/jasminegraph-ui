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
import { render, screen, fireEvent } from '@testing-library/react';

const mockDispatch = jest.fn();
const mockPush = jest.fn();
const mockSetIsUserAuthenticated = jest.fn((value: boolean) => ({
  type: 'auth/set_Is_User_Authenticated',
  payload: value,
}));
const mockSetClearUserData = jest.fn(() => ({ type: 'auth/set_Clear_User_Data' }));

jest.mock(
  'antd',
  () => {
    const React = require('react');
    const Layout = {
      Header: ({ children }: any) => <header>{children}</header>,
    };
    const Dropdown = ({ menu, children }: any) => (
      <div>
        {children}
        <button onClick={() => menu?.items?.[0]?.onClick?.()}>trigger-logout</button>
      </div>
    );
    const Space = ({ children }: any) => <div>{children}</div>;
    const Avatar = () => <div data-testid="avatar" />;
    const Typography = {};
    return { Layout, Avatar, Dropdown, Space, Typography };
  },
  { virtual: true }
);

jest.mock(
  '@ant-design/icons',
  () => ({ UserOutlined: () => <span /> }),
  { virtual: true }
);

jest.mock(
  'react-redux',
  () => ({ useDispatch: () => mockDispatch }),
  { virtual: true }
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/redux/hook', () => ({
  useAppSelector: (selector: any) => selector({ authData: { userData: { email: 'admin@jg.io' } } }),
}));

jest.mock('@/redux/features/authData', () => ({
  set_Is_User_Authenticated: (value: boolean) => mockSetIsUserAuthenticated(value),
  set_Clear_User_Data: () => mockSetClearUserData(),
}));

import MainHeader from '../../../../../Frontend/src/layouts/header/header';

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders app title and current user email', () => {
    render(<MainHeader />);

    expect(screen.getByText('JasmineGraph')).toBeInTheDocument();
    expect(screen.getByText('admin@jg.io')).toBeInTheDocument();
  });

  it('dispatches logout actions, clears storage, and redirects to /auth', () => {
    const clearSpy = jest.spyOn(Storage.prototype, 'clear');

    render(<MainHeader />);
    fireEvent.click(screen.getByRole('button', { name: 'trigger-logout' }));

    expect(mockSetIsUserAuthenticated).toHaveBeenCalledWith(false);
    expect(mockSetClearUserData).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/set_Is_User_Authenticated',
      payload: false,
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/set_Clear_User_Data' });
    expect(clearSpy).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/auth');

    clearSpy.mockRestore();
  });
});
