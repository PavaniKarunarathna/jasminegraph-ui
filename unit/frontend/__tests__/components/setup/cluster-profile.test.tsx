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
import ClusterSetup from '../../../../../Frontend/src/components/setup/cluster-profile';
import { addNewCluster } from '../../../../../Frontend/src/services/cluster-service';
import useAccessToken from '../../../../../Frontend/src/hooks/useAccessToken';

jest.mock('../../../../../Frontend/src/services/cluster-service', () => ({
  addNewCluster: jest.fn(),
}));

jest.mock('../../../../../Frontend/src/hooks/useAccessToken', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockResetFields = jest.fn();
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

  Form.useForm = () => [{ resetFields: mockResetFields }];
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
  Input.TextArea = (props: any) => <textarea {...props} />;

  return {
    Form,
    Input,
    Button: ({ children, htmlType, onClick, disabled }: any) => (
      <button type={htmlType || 'button'} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    message: {
      error: jest.fn(),
    },
  };
}, { virtual: true });

describe('ClusterSetup', () => {
  const mockOnSuccess = jest.fn();
  const mockGetSrvAccessToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAccessToken as jest.Mock).mockReturnValue({
      getSrvAccessToken: mockGetSrvAccessToken,
    });
    mockGetSrvAccessToken.mockReturnValue('srv-token');
  });

  it('renders cluster setup form correctly', () => {
    render(<ClusterSetup onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/cluster name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add default cluster/i })).toBeInTheDocument();
  });

  it('submits valid data and calls onSuccess', async () => {
    (addNewCluster as jest.Mock).mockResolvedValue({ id: 'cluster-1' });

    render(<ClusterSetup onSuccess={mockOnSuccess} />);

    await userEvent.type(screen.getByLabelText(/cluster name/i), 'Default Cluster');
    await userEvent.type(screen.getByLabelText(/description/i), 'Primary cluster');
    await userEvent.type(screen.getByLabelText(/host/i), '127.0.0.1');
    await userEvent.type(screen.getByLabelText(/port/i), '7777');
    fireEvent.click(screen.getByRole('button', { name: /add default cluster/i }));

    await waitFor(() => {
      expect(addNewCluster).toHaveBeenCalledWith(
        'Default Cluster',
        'Primary cluster',
        '127.0.0.1',
        '7777',
        'srv-token'
      );
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockResetFields).toHaveBeenCalledTimes(1);
    });
  });

  it('shows API error message and does not call onSuccess', async () => {
    (addNewCluster as jest.Mock).mockResolvedValue({
      errorCode: 'CLUSTER_EXISTS',
      message: 'Cluster already exists',
    });

    render(<ClusterSetup onSuccess={mockOnSuccess} />);

    await userEvent.type(screen.getByLabelText(/cluster name/i), 'Default Cluster');
    await userEvent.type(screen.getByLabelText(/host/i), '127.0.0.1');
    await userEvent.type(screen.getByLabelText(/port/i), '7777');
    fireEvent.click(screen.getByRole('button', { name: /add default cluster/i }));

    await waitFor(() => {
      const { message } = require('antd');
      expect(message.error).toHaveBeenCalledWith('Cluster already exists');
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockResetFields).not.toHaveBeenCalled();
  });

  it('shows unexpected error message when add cluster throws', async () => {
    (addNewCluster as jest.Mock).mockRejectedValue(new Error('network down'));

    render(<ClusterSetup onSuccess={mockOnSuccess} />);

    await userEvent.type(screen.getByLabelText(/cluster name/i), 'Default Cluster');
    await userEvent.type(screen.getByLabelText(/host/i), '127.0.0.1');
    await userEvent.type(screen.getByLabelText(/port/i), '7777');
    fireEvent.click(screen.getByRole('button', { name: /add default cluster/i }));

    await waitFor(() => {
      const { message } = require('antd');
      expect(message.error).toHaveBeenCalledWith('An unexpected error occurred while adding the cluster.');
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
