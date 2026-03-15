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

const mockDispatch = jest.fn();
const mockAddError = jest.fn((payload) => ({ type: 'activity/add_error', payload }));

jest.mock('@/redux/hook', () => ({
  useAppDispatch: () => mockDispatch,
}));

jest.mock('@/redux/features/activityData', () => ({
  add_error: (payload: any) => mockAddError(payload),
}));

import { useActivity } from '../../../../Frontend/src/hooks/useActivity';

describe('useActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reportError dispatches add_error action with provided fields', () => {
    const { result } = renderHook(() => useActivity());

    act(() => {
      result.current.reportError({
        menuItem: '/graph-panel',
        title: 'Load failed',
        message: 'Network error',
      });
    });

    expect(mockAddError).toHaveBeenCalledWith({
      menuItem: '/graph-panel',
      title: 'Load failed',
      message: 'Network error',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'activity/add_error',
      payload: {
        menuItem: '/graph-panel',
        title: 'Load failed',
        message: 'Network error',
      },
    });
  });

  it('reportErrorFromException uses custom title and Error message', () => {
    const { result } = renderHook(() => useActivity());

    act(() => {
      result.current.reportErrorFromException('/query-interface', new Error('Boom'), 'Custom');
    });

    expect(mockAddError).toHaveBeenCalledWith({
      menuItem: '/query-interface',
      title: 'Custom',
      message: 'Boom',
    });
  });

  it('reportErrorFromException handles axios-style response message', () => {
    const { result } = renderHook(() => useActivity());

    act(() => {
      result.current.reportErrorFromException('/logs', {
        response: { data: { message: 'Bad gateway' } },
      });
    });

    expect(mockAddError).toHaveBeenCalledWith({
      menuItem: '/logs',
      title: 'An error occurred',
      message: 'Bad gateway',
    });
  });

  it('reportErrorFromException handles string and unknown values', () => {
    const { result } = renderHook(() => useActivity());

    act(() => {
      result.current.reportErrorFromException('/performance', 'Simple failure');
      result.current.reportErrorFromException('/performance', { foo: 'bar' });
    });

    expect(mockAddError).toHaveBeenNthCalledWith(1, {
      menuItem: '/performance',
      title: 'An error occurred',
      message: 'Simple failure',
    });
    expect(mockAddError).toHaveBeenNthCalledWith(2, {
      menuItem: '/performance',
      title: 'An error occurred',
      message: 'Unknown error',
    });
  });
});
