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
import KafkaUploadModal from '../../../../../Frontend/src/components/graph-panel/kafka-upload-modal';

jest.mock('antd', () => {
  const React = require('react');

  return {
    Modal: ({ title, open, children, onOk, onCancel }: any) => {
      if (!open) {
        return null;
      }

      return (
        <div>
          <h2>{title}</h2>
          {children}
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onOk}>OK</button>
        </div>
      );
    },
  };
}, { virtual: true });

describe('KafkaUploadModal (Graph Panel)', () => {
  const mockSetOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders kafka modal content when open is true', () => {
    render(<KafkaUploadModal open={true} setOpen={mockSetOpen} />);

    expect(screen.getByText(/apache kafka/i)).toBeInTheDocument();
    expect(screen.getByText(/not implemented/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<KafkaUploadModal open={false} setOpen={mockSetOpen} />);

    expect(screen.queryByText(/apache kafka/i)).not.toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', () => {
    render(<KafkaUploadModal open={true} setOpen={mockSetOpen} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('closes modal when ok is clicked', () => {
    render(<KafkaUploadModal open={true} setOpen={mockSetOpen} />);

    const okButton = screen.getByRole('button', { name: /ok/i });
    fireEvent.click(okButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
