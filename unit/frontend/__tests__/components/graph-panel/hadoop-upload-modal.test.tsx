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
import HadoopUploadModal from '../../../../../Frontend/src/components/graph-panel/hadoop-upload-modal';

jest.mock('antd', () => {
  const React = require('react');
  const List = ({ dataSource, renderItem }: any) => (
    <ul>
      {dataSource.map((item: string, index: number) => (
        <li key={`${item}-${index}`}>{renderItem(item)}</li>
      ))}
    </ul>
  );

  List.Item = ({ children }: any) => <div>{children}</div>;

  return {
    Modal: ({ title, open, children, footer }: any) => {
      if (!open) {
        return null;
      }

      return (
        <div>
          <h2>{title}</h2>
          {children}
          <div>{footer}</div>
        </div>
      );
    },
    List,
    Checkbox: ({ checked, onChange, children }: any) => (
      <label>
        <input type="checkbox" checked={checked} onChange={onChange} />
        {children}
      </label>
    ),
    Button: ({ children, onClick, disabled }: any) => (
      <button onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
  };
}, { virtual: true });

describe('HadoopUploadModal', () => {
  const mockSetOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the modal form when open is true', () => {
    render(<HadoopUploadModal open={true} setOpen={mockSetOpen} />);

    expect(screen.getByText(/hadoop hdfs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ip/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<HadoopUploadModal open={false} setOpen={mockSetOpen} />);

    expect(screen.queryByText(/hadoop hdfs/i)).not.toBeInTheDocument();
  });

  it('requests files from backend and renders the returned file list', async () => {
    localStorage.setItem('selectedCluster', 'cluster-1');
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(['sample-1.txt', 'sample-2.txt']),
    });

    render(<HadoopUploadModal open={true} setOpen={mockSetOpen} />);

    const connectButton = screen.getByRole('button', { name: /connect/i });
    const form = connectButton.closest('form') as HTMLFormElement;
    fireEvent.submit(form, {
      target: {
        ip: { value: '127.0.0.1' },
        port: { value: '9000' },
      },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'backend/graph/hadoop?ip=127.0.0.1&port=9000',
        {
          method: 'GET',
          headers: { 'Cluster-ID': 'cluster-1' },
        }
      );
    });

    expect(await screen.findByText('sample-1.txt')).toBeInTheDocument();
    expect(screen.getByText('sample-2.txt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
  });

  it('enables upload after selecting a file and closes on upload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(['graph.csv']),
    });

    render(<HadoopUploadModal open={true} setOpen={mockSetOpen} />);

    const connectButton = screen.getByRole('button', { name: /connect/i });
    const form = connectButton.closest('form') as HTMLFormElement;
    fireEvent.submit(form, {
      target: {
        ip: { value: 'localhost' },
        port: { value: '9000' },
      },
    });

    const uploadButton = await screen.findByRole('button', { name: /upload/i });
    expect(uploadButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /graph\.csv/i }));
    expect(uploadButton).toBeEnabled();

    fireEvent.click(uploadButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('closes the modal when cancel is clicked', () => {
    render(<HadoopUploadModal open={true} setOpen={mockSetOpen} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
