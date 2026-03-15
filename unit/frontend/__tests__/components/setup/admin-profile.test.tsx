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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminProfile from '../../../../../Frontend/src/components/setup/admin-profile';
import {
  getUserDataByToken,
  registerAdmin,
  userLogin,
} from '../../../../../Frontend/src/services/auth-service';
import useAccessToken from '../../../../../Frontend/src/hooks/useAccessToken';
import { set_User_Data } from '../../../../../Frontend/src/redux/features/authData';

jest.mock('../../../../../Frontend/src/services/auth-service', () => ({
  registerAdmin: jest.fn(),
  userLogin: jest.fn(),
  getUserDataByToken: jest.fn(),
}));

const mockSetSrvAccessToken = jest.fn();
const mockSetSrvRefreshToken = jest.fn();
jest.mock('../../../../../Frontend/src/hooks/useAccessToken', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => mockDispatch),
}), { virtual: true });

jest.mock('../../../../../Frontend/src/redux/features/authData', () => ({
  set_User_Data: jest.fn((payload: any) => ({ type: 'auth/set_User_Data', payload })),
}));

jest.mock('antd', () => {
  const React = require('react');

  const Form = ({ children, onFinish }: any) => {
    const handleSubmit = (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const values: Record<string, string> = {};
      formData.forEach((value, key) => {
        values[key] = String(value);
      });
      onFinish?.(values);
    };

    return <form onSubmit={handleSubmit}>{children}</form>;
  };

  Form.useForm = () => [{}];
  Form.Item = ({ children, label, name }: any) => {
    const child = name
      ? React.cloneElement(children, { name: String(name) })
      : children;

    if (!label) {
      return <div>{child}</div>;
    }

    return (
      <label>
        {label}
        {child}
      </label>
    );
  };

  const Input = (props: any) => <input {...props} />;
  Input.Password = (props: any) => <input type="password" {...props} />;

  return {
    Form,
    Input,
    Button: ({ children, htmlType, onClick, disabled }: any) => (
      <button type={htmlType || 'button'} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    message: {
      loading: jest.fn(),
      error: jest.fn(),
    },
  };
}, { virtual: true });

describe('AdminProfile', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAccessToken as jest.Mock).mockReturnValue({
      setSrvAccessToken: mockSetSrvAccessToken,
      setSrvRefreshToken: mockSetSrvRefreshToken,
    });
  });

  it('renders admin profile form correctly', () => {
    render(<AdminProfile onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create profile/i })).toBeInTheDocument();
  });

  it('submits valid data and calls auth/token/dispatch flow', async () => {
    (registerAdmin as jest.Mock).mockResolvedValue({ ok: true });
    (userLogin as jest.Mock).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    (getUserDataByToken as jest.Mock).mockResolvedValue({
      data: {
        data: {
          email: 'admin@jasminegraph.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          enabled: true,
          id: '1',
        },
      },
    });

    render(<AdminProfile onSuccess={mockOnSuccess} />);

    await userEvent.type(screen.getByLabelText(/first name/i), 'Admin');
    await userEvent.type(screen.getByLabelText(/last name/i), 'User');
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'admin@jasminegraph.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    await waitFor(() => {
      expect(registerAdmin).toHaveBeenCalledWith(
        'Admin',
        'User',
        'admin@jasminegraph.com',
        'password123'
      );
    });

    await waitFor(() => {
      expect(userLogin).toHaveBeenCalledWith('admin@jasminegraph.com', 'password123');
      expect(mockSetSrvAccessToken).toHaveBeenCalledWith('access-token');
      expect(mockSetSrvRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(getUserDataByToken).toHaveBeenCalledWith('access-token');
      expect(set_User_Data).toHaveBeenCalledWith({
        email: 'admin@jasminegraph.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        enabled: true,
        id: '1',
      });
      expect(mockDispatch).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error message and does not call onSuccess when register fails', async () => {
    (registerAdmin as jest.Mock).mockRejectedValue(new Error('register failed'));

    render(<AdminProfile onSuccess={mockOnSuccess} />);

    await userEvent.type(screen.getByLabelText(/first name/i), 'Admin');
    await userEvent.type(screen.getByLabelText(/last name/i), 'User');
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'admin@jasminegraph.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    await waitFor(() => {
      const { message } = require('antd');
      expect(message.error).toHaveBeenCalledWith('Failed to create profile');
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
