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

import { renderHook, act } from '@testing-library/react';
import { useIframeAvailability } from '../../../../Frontend/src/hooks/useIframeAvailability';

describe('useIframeAvailability', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('starts with none state', () => {
    const { result } = renderHook(() => useIframeAvailability(1000));
    expect(result.current[0]).toBe('none');
  });

  it('changes to service when timeout elapses', () => {
    const { result } = renderHook(() => useIframeAvailability(1000));

    act(() => {
      jest.advanceTimersByTime(1001);
    });

    expect(result.current[0]).toBe('service');
  });

  it('sets embed state and prevents timeout transition', () => {
    const { result } = renderHook(() => useIframeAvailability(1000));

    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe('embed');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current[0]).toBe('embed');
  });

  it('handleIframeLoad clears timeout and keeps none state', () => {
    const { result } = renderHook(() => useIframeAvailability(1000));

    act(() => {
      result.current[2]();
      jest.advanceTimersByTime(1500);
    });

    expect(result.current[0]).toBe('none');
  });
});
