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
import WelcomeScreen from '../../../../../Frontend/src/components/setup/welcome-screen';

jest.mock('antd', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}), { virtual: true });

describe('WelcomeScreen', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome content correctly', () => {
    render(<WelcomeScreen onSuccess={mockOnSuccess} />);

    expect(screen.getByText(/welcome to the setup wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/follow the steps to get started/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('calls onSuccess when next button is clicked', () => {
    render(<WelcomeScreen onSuccess={mockOnSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});
