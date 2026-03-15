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
import FinishStep from '../../../../../Frontend/src/components/setup/last-step';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('antd', () => {
  const React = require('react');

  return {
    Button: ({ children, onClick }: any) => (
      <button onClick={onClick}>{children}</button>
    ),
    Result: ({ title, subTitle, extra }: any) => (
      <div>
        <h2>{title}</h2>
        <p>{subTitle}</p>
        <div>{extra}</div>
      </div>
    ),
  };
}, { virtual: true });

describe('FinishStep', () => {
  const replaceMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: replaceMock });
  });

  it('renders completion message and start button', () => {
    render(<FinishStep />);

    expect(screen.getByText(/profile creation completed/i)).toBeInTheDocument();
    expect(screen.getByText(/your profile has been successfully created/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /let's start/i })).toBeInTheDocument();
  });

  it('navigates to home when start button is clicked', () => {
    render(<FinishStep />);

    fireEvent.click(screen.getByRole('button', { name: /let's start/i }));

    expect(replaceMock).toHaveBeenCalledWith('/');
  });
});
