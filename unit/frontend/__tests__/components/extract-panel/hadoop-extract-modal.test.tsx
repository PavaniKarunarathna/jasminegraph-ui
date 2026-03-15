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
import HadoopExtractModal from '@/components/extract-panel/hadoop-extract-modal';

describe('HadoopExtractModal', () => {
  const mockSetOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title when open', () => {
    render(<HadoopExtractModal open={true} setOpen={mockSetOpen} />);

    expect(screen.getByText(/hadoop hdfs/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render title when closed', () => {
    render(<HadoopExtractModal open={false} setOpen={mockSetOpen} />);

    expect(screen.queryByText(/hadoop hdfs/i)).not.toBeInTheDocument();
  });

  it('calls setOpen(false) when cancel is clicked', () => {
    render(<HadoopExtractModal open={true} setOpen={mockSetOpen} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
