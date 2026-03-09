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
import { render, screen } from '@testing-library/react';
import PerformancePage from '../../../../../Frontend/src/app/performance/page';

jest.mock('../../../../../Frontend/src/layouts/page-wrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../../../../Frontend/src/hooks/useIframeAvailability', () => ({
  useIframeAvailability: jest.fn(),
}));

jest.mock('../../../../../Frontend/src/properties', () => ({
  GRAFANA_DASHBOARD: {
    baseUrl: 'http://localhost:3000',
    uid: 'test-uid',
    slug: 'test-dashboard',
  },
}));

import { useIframeAvailability } from '../../../../../Frontend/src/hooks/useIframeAvailability';

describe('PerformancePage', () => {
  const mockUseIframeAvailability = useIframeAvailability as jest.MockedFunction<typeof useIframeAvailability>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Grafana iframe when no error', () => {
    mockUseIframeAvailability.mockReturnValue(['none', jest.fn(), jest.fn()]);
    
    render(<PerformancePage />);

    const iframe = screen.getByTitle('Grafana Dashboard');
    expect(iframe).toBeInTheDocument();
  });

  it('displays service unavailable message on service error', () => {
    mockUseIframeAvailability.mockReturnValue(['service', jest.fn(), jest.fn()]);
    
    render(<PerformancePage />);

    expect(screen.getByText(/Performance dashboard is currently unavailable/i)).toBeInTheDocument();
  });

  it('displays embed error message with link to open in new tab', () => {
    mockUseIframeAvailability.mockReturnValue(['embed', jest.fn(), jest.fn()]);
    
    render(<PerformancePage />);

    expect(screen.getByText(/Unable to display performance dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Performance Dashboard in New Tab/i)).toBeInTheDocument();
  });
});
