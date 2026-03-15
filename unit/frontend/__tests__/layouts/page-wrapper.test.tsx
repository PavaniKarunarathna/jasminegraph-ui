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

jest.mock(
  'antd',
  () => ({
    Layout: ({ children }: any) => <div data-testid="mock-layout">{children}</div>,
  }),
  { virtual: true }
);

jest.mock('../../../../Frontend/src/layouts/header/header', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-main-header" />,
}));

jest.mock('../../../../Frontend/src/layouts/menu/side-menu', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-side-menu" />,
}));

jest.mock('../../../../Frontend/src/layouts/main-wrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="mock-main-wrapper">{children}</div>,
}));

import PageWrapper from '../../../../Frontend/src/layouts/page-wrapper';

describe('PageWrapper', () => {
  it('renders MainWrapper, MainHeader, SideMenu, and children', () => {
    render(
      <PageWrapper>
        <div>Page Content</div>
      </PageWrapper>
    );

    expect(screen.getByTestId('mock-main-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('mock-main-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-side-menu')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders nested Layout containers', () => {
    render(
      <PageWrapper>
        <div>Child</div>
      </PageWrapper>
    );

    expect(screen.getAllByTestId('mock-layout')).toHaveLength(2);
  });
});
