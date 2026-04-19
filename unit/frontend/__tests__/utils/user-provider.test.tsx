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

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import mockUserFixture from '../../fixtures/mock-user.json';

const mockReplace = jest.fn();
const mockDispatch = jest.fn();
const mockGetSrvAccessToken = jest.fn();
const mockIsTokenExpired = jest.fn();
const mockRefreshAccessToken = jest.fn();
const mockGetUserDataByToken = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: () => ({ replace: mockReplace }),
}), { virtual: true });

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ authData: { isUserDataFetched: false } }),
}), { virtual: true });

jest.mock('antd', () => ({
  Spin: ({ indicator }: any) => <div data-testid="spinner">{indicator}</div>,
  message: { error: jest.fn() },
}), { virtual: true });

jest.mock('@ant-design/icons', () => ({
  LoadingOutlined: () => <span data-testid="loading-icon" />,
}), { virtual: true });

jest.mock('@/hooks/useAccessToken', () => ({
  __esModule: true,
  default: () => ({
    getSrvAccessToken: mockGetSrvAccessToken,
    isTokenExpired: mockIsTokenExpired,
    refreshAccessToken: mockRefreshAccessToken,
  }),
}), { virtual: true });

jest.mock('@/services/auth-service', () => ({
  getUserDataByToken: (...args: any[]) => mockGetUserDataByToken(...args),
}), { virtual: true });

jest.mock('@/redux/features/authData', () => ({
  set_User_Data: (payload: any) => ({ type: 'auth/set_User_Data', payload }),
}), { virtual: true });

jest.mock('axios', () => ({
  __esModule: true,
  default: { defaults: { headers: { common: {} } } },
}), { virtual: true });

import { usePathname } from 'next/navigation';
import UserProvider from '../../../../Frontend/src/utils/user-provider';

const renderWithChild = () =>
  render(
    <UserProvider>
      <div data-testid="child">content</div>
    </UserProvider>
  );

describe('UserProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows children immediately on /auth without fetching user', async () => {
    (usePathname as jest.Mock).mockReturnValue('/auth');

    renderWithChild();

    await waitFor(() => expect(screen.getByTestId('child')).toBeInTheDocument());
    expect(mockGetUserDataByToken).not.toHaveBeenCalled();
  });

  it('shows children immediately on /setup without fetching user', async () => {
    (usePathname as jest.Mock).mockReturnValue('/setup');

    renderWithChild();

    await waitFor(() => expect(screen.getByTestId('child')).toBeInTheDocument());
    expect(mockGetUserDataByToken).not.toHaveBeenCalled();
  });

  it('redirects to /auth when no access token is present', async () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockGetSrvAccessToken.mockReturnValue(null);

    renderWithChild();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth'));
  });

  it('fetches user data and dispatches set_User_Data when token is valid', async () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockGetSrvAccessToken.mockReturnValue('valid-token');
    mockIsTokenExpired.mockReturnValue(false);
    mockGetUserDataByToken.mockResolvedValue({
      data: {
        data: {
          id: mockUserFixture.id,
          email: mockUserFixture.email,
          firstName: mockUserFixture.firstName,
          lastName: mockUserFixture.lastName,
          role: mockUserFixture.role,
          enabled: true,
        },
      },
    });

    await act(async () => {
      renderWithChild();
    });

    await waitFor(() => expect(screen.getByTestId('child')).toBeInTheDocument());
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/set_User_Data',
      payload: {
        id: mockUserFixture.id,
        email: mockUserFixture.email,
        firstName: mockUserFixture.firstName,
        lastName: mockUserFixture.lastName,
        role: mockUserFixture.role,
        enabled: true,
      },
    });
  });

  it('refreshes expired token and fetches user data successfully', async () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockGetSrvAccessToken.mockReturnValue('expired-token');
    mockIsTokenExpired.mockReturnValue(true);
    mockRefreshAccessToken.mockResolvedValue('new-token');
    mockGetUserDataByToken.mockResolvedValue({
      data: {
        data: {
          id: mockUserFixture.id,
          email: mockUserFixture.email,
          firstName: mockUserFixture.firstName,
          lastName: mockUserFixture.lastName,
          role: mockUserFixture.role,
          enabled: true,
        },
      },
    });

    await act(async () => {
      renderWithChild();
    });

    await waitFor(() => expect(screen.getByTestId('child')).toBeInTheDocument());
    expect(mockGetUserDataByToken).toHaveBeenCalledWith('new-token');
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('redirects to /auth when token refresh fails', async () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockGetSrvAccessToken.mockReturnValue('expired-token');
    mockIsTokenExpired.mockReturnValue(true);
    mockRefreshAccessToken.mockRejectedValue(new Error('Refresh failed'));

    renderWithChild();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth'));
  });

  it('redirects to /auth and shows error when getUserDataByToken throws', async () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockGetSrvAccessToken.mockReturnValue('valid-token');
    mockIsTokenExpired.mockReturnValue(false);
    mockGetUserDataByToken.mockRejectedValue(new Error('Network error'));

    renderWithChild();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth'));
  });
});
