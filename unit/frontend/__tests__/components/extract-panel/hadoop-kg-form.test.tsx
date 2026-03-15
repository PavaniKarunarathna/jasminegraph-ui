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
import HadoopKgForm from '@/components/extract-panel/hadoop-kg-form';
import { constructKG } from '@/services/graph-service';
import axios from 'axios';

jest.mock('@/services/graph-service', () => ({
  constructKG: jest.fn(),
}));

jest.mock('axios');

jest.mock('@/hooks/useActivity', () => ({
  useActivity: () => ({
    reportErrorFromException: jest.fn(),
  }),
}));

describe('HadoopKgForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders HDFS step by default', () => {
    render(
      <HadoopKgForm
        onSuccess={mockOnSuccess}
        currentPage={0}
        initForm={{} as any}
      />
    );

    expect(screen.getByText(/hdfs configuration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hdfs server ip/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hdfs port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hdfs file path/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /next: validate hdfs/i })
    ).toBeInTheDocument();
  });

  it('moves to LLM step when HDFS validation succeeds', async () => {
    (constructKG as jest.Mock).mockResolvedValue({ status: 200 });

    render(
      <HadoopKgForm
        onSuccess={mockOnSuccess}
        currentPage={0}
        initForm={{} as any}
      />
    );

    fireEvent.change(screen.getByLabelText(/hdfs server ip/i), {
      target: { value: '127.0.0.1' },
    });
    fireEvent.change(screen.getByLabelText(/hdfs port/i), {
      target: { value: '9000' },
    });
    fireEvent.change(screen.getByLabelText(/hdfs file path/i), {
      target: { value: '/input/file.txt' },
    });

    fireEvent.click(screen.getByRole('button', { name: /next: validate hdfs/i }));

    await waitFor(() => {
      expect(constructKG).toHaveBeenCalledWith(
        '127.0.0.1',
        '9000',
        '/input/file.txt',
        null,
        null,
        null,
        null,
        null,
        null
      );
    });

    expect(screen.getByLabelText(/llm engine location/i)).toBeInTheDocument();
    expect(screen.getByText(/inference engine/i)).toBeInTheDocument();
  });

  it('submits construction successfully from paused flow', async () => {
    (constructKG as jest.Mock)
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 200 });

    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        models: [{ name: 'llama3' }],
      },
    });

    render(
      <HadoopKgForm
        onSuccess={mockOnSuccess}
        currentPage={1}
        initForm={{
          status: 'paused',
          graphId: 12,
          hdfsIp: '127.0.0.1',
          hdfsPort: '9000',
          hdfsFilePath: '/input/file.txt',
        } as any}
      />
    );

    fireEvent.change(screen.getByLabelText(/llm engine location/i), {
      target: { value: 'http://localhost:11434' },
    });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Ollama'));

    fireEvent.click(screen.getByRole('button', { name: /next: fetch models/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:11434/api/tags', {
        timeout: 8000,
      });
    });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'llama3' }));
    fireEvent.change(screen.getByLabelText(/chunk size/i), {
      target: { value: '1024' },
    });

    fireEvent.click(screen.getByRole('button', { name: /resume construction/i }));

    await waitFor(() => {
      expect(constructKG).toHaveBeenCalled();
    });
    expect(constructKG).toHaveBeenCalledTimes(2);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});
