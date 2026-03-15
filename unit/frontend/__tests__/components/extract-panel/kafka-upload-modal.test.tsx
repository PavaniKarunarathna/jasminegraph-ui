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
import KafkaUploadModal from '@/components/extract-panel/kafka-upload-modal';

describe('KafkaUploadModal', () => {
  const mockSetOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal title and placeholder content when open', () => {
    render(<KafkaUploadModal open={true} setOpen={mockSetOpen} />);

    expect(screen.getByText(/apache kafka/i)).toBeInTheDocument();
    expect(screen.getByText(/not implemented/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render modal content when closed', () => {
    render(<KafkaUploadModal open={false} setOpen={mockSetOpen} />);

    expect(screen.queryByText(/apache kafka/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not implemented/i)).not.toBeInTheDocument();
  });

  it('calls setOpen(false) when cancel is clicked', () => {
    render(<KafkaUploadModal open={true} setOpen={mockSetOpen} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('calls setOpen(false) when ok is clicked', () => {
    render(<KafkaUploadModal open={true} setOpen={mockSetOpen} />);

    fireEvent.click(screen.getByRole('button', { name: /ok/i }));
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
