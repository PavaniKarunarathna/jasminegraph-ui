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
import { render, screen } from '../../setup/test-utils';
import { AboutJasmine } from '../../../../Frontend/src/components/guides/about-jasmine';

describe('AboutJasmine', () => {
  it('renders about jasmine component correctly', () => {
    render(<AboutJasmine />);

    expect(screen.getByText(/about jasminegraph/i)).toBeInTheDocument();
    expect(screen.getByText(/knowledge graph platform/i)).toBeInTheDocument();
  });

  it('displays key features', () => {
    render(<AboutJasmine />);

    expect(screen.getByText(/distributed graph processing/i)).toBeInTheDocument();
    expect(screen.getByText(/real-time analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/scalable architecture/i)).toBeInTheDocument();
  });

  it('shows version information', () => {
    render(<AboutJasmine />);

    expect(screen.getByText(/version/i)).toBeInTheDocument();
  });

  it('displays documentation links', () => {
    render(<AboutJasmine />);

    const documentationLinks = screen.getAllByRole('link');
    expect(documentationLinks.length).toBeGreaterThan(0);

    documentationLinks.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('renders with proper semantic structure', () => {
    render(<AboutJasmine />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLengthGreaterThan(0);
  });

  it('includes contact information', () => {
    render(<AboutJasmine />);

    expect(screen.getByText(/contact/i)).toBeInTheDocument();
  });
});
