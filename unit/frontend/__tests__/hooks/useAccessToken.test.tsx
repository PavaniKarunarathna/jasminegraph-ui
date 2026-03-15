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
import axios from 'axios';
import useAccessToken, { ACCESS_TOKEN, REFRESH_TOKEN } from '../../../../Frontend/src/hooks/useAccessToken';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    getAll: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAccessToken Hook', () => {
  let atobSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    atobSpy = jest.spyOn(window, 'atob');
  });

  afterEach(() => {
    atobSpy.mockRestore();
  });

  it('exposes all expected API functions', () => {
    const { result } = renderHook(() => useAccessToken());

    expect(typeof result.current.getSrvAccessToken).toBe('function');
    expect(typeof result.current.setSrvAccessToken).toBe('function');
    expect(typeof result.current.getSrvRefreshToken).toBe('function');
    expect(typeof result.current.setSrvRefreshToken).toBe('function');
    expect(typeof result.current.clearTokens).toBe('function');
    expect(typeof result.current.isTokenExpired).toBe('function');
    expect(typeof result.current.refreshAccessToken).toBe('function');
  });

  it('stores and retrieves access and refresh tokens', () => {
    const { result } = renderHook(() => useAccessToken());

    act(() => {
      result.current.setSrvAccessToken('access-1');
      result.current.setSrvRefreshToken('refresh-1');
    });

    expect(result.current.getSrvAccessToken()).toBe('access-1');
    expect(result.current.getSrvRefreshToken()).toBe('refresh-1');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(ACCESS_TOKEN, 'access-1');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(REFRESH_TOKEN, 'refresh-1');
  });

  it('clears both tokens', () => {
    const { result } = renderHook(() => useAccessToken());

    act(() => {
      result.current.setSrvAccessToken('access');
      result.current.setSrvRefreshToken('refresh');
      result.current.clearTokens();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN);
    expect(result.current.getSrvAccessToken()).toBeNull();
    expect(result.current.getSrvRefreshToken()).toBeNull();
  });

  it('returns true for null or malformed token', () => {
    const { result } = renderHook(() => useAccessToken());

    expect(result.current.isTokenExpired(null)).toBe(true);
    expect(result.current.isTokenExpired('bad-token')).toBe(true);
  });

  it('returns false for a non-expired token payload', () => {
    const { result } = renderHook(() => useAccessToken());
    atobSpy.mockReturnValue(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }));

    expect(result.current.isTokenExpired('a.payload.c')).toBe(false);
  });

  it('returns true for an expired token payload', () => {
    const { result } = renderHook(() => useAccessToken());
    atobSpy.mockReturnValue(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 600 }));

    expect(result.current.isTokenExpired('a.payload.c')).toBe(true);
  });

  it('refreshAccessToken calls backend and stores returned tokens', async () => {
    const { result } = renderHook(() => useAccessToken());
    localStorageMock.setItem(REFRESH_TOKEN, 'refresh-old');
    mockAxios.post.mockResolvedValue({
      data: { accessToken: 'access-new', refreshToken: 'refresh-new' },
    } as any);

    const token = await result.current.refreshAccessToken();

    expect(mockAxios.post).toHaveBeenCalledWith(
      '/backend/auth/refresh-token',
      { token: 'refresh-old' },
      { _isRefreshRequest: true }
    );
    expect(token).toBe('access-new');
    expect(result.current.getSrvAccessToken()).toBe('access-new');
    expect(result.current.getSrvRefreshToken()).toBe('refresh-new');
  });

  it('refreshAccessToken clears tokens and throws when no refresh token', async () => {
    const { result } = renderHook(() => useAccessToken());
    localStorageMock.setItem(ACCESS_TOKEN, 'existing-access');

    await expect(result.current.refreshAccessToken()).rejects.toThrow(
      'No refresh token available for refresh'
    );

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(REFRESH_TOKEN);
  });

  it('throws localStorage errors from set/get methods', () => {
    const { result } = renderHook(() => useAccessToken());
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('access denied');
    });

    expect(() => result.current.setSrvAccessToken('x')).toThrow('quota exceeded');
    expect(() => result.current.getSrvAccessToken()).toThrow('access denied');
  });
});

