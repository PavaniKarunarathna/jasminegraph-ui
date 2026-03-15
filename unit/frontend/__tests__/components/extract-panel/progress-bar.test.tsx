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
import { render } from '@testing-library/react';
import SegmentedProgress from '@/components/extract-panel/progress-bar';

describe('SegmentedProgress', () => {
  it('renders default number of segments', () => {
    const { container } = render(<SegmentedProgress progress={50} />);
    const segments = container.querySelectorAll('div[style*="height: 75px"]');

    expect(segments).toHaveLength(50);
  });

  it('respects custom segment count', () => {
    const { container } = render(<SegmentedProgress progress={50} segments={10} />);
    const segments = container.querySelectorAll('div[style*="height: 75px"]');

    expect(segments).toHaveLength(10);
  });

  it('fills segments based on progress percentage', () => {
    const { container } = render(<SegmentedProgress progress={40} segments={10} />);
    const segmentElements = Array.from(
      container.querySelectorAll('div[style*="height: 75px"]')
    );

    const filledSegments = segmentElements.filter((segment) =>
      segment.getAttribute('style')?.includes('background-color: rgb(22, 119, 255)') ||
      segment.getAttribute('style')?.includes('background-color: #1677ff')
    );

    expect(filledSegments.length).toBe(4);
  });
});
