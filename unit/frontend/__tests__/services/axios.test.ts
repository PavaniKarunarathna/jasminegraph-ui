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

const mockAuthApiInstance = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

const mockApiInstance = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

const mockAxios = Object.assign(jest.fn(), {
  create: jest.fn(),
  post: jest.fn(),
});

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxios,
}));

describe('axios service', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockAxios.create
      .mockReturnValueOnce(mockAuthApiInstance as any)
      .mockReturnValueOnce(mockApiInstance as any);
  });

  it('creates authApi and api instances with expected base headers', async () => {
    await import('../../../../Frontend/src/services/axios');

    expect(mockAxios.create).toHaveBeenNthCalledWith(1, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer null',
        'Cluster-ID': null,
      },
    });
    expect(mockAxios.create).toHaveBeenNthCalledWith(2, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  });

  it('request interceptor adds Authorization header from session storage AUTH token', async () => {
    await import('../../../../Frontend/src/services/axios');
    sessionStorage.setItem('AUTH', JSON.stringify({ access_token: 'session-token' }));

    const requestInterceptor = (mockApiInstance.interceptors.request.use as jest.Mock).mock.calls[0][0];
    const result = requestInterceptor({ headers: {} });

    expect(result.headers.Authorization).toBe('Bearer session-token');
  });

  it('response interceptor refreshes token on 401 and retries original request', async () => {
    const axiosModule = await import('../../../../Frontend/src/services/axios');
    localStorage.setItem('auth.srv.refresh.token', 'refresh-token');
    mockAxios.post.mockResolvedValueOnce({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    });
    mockAxios.mockResolvedValueOnce({ data: { ok: true } });

    const responseErrorHandler = (mockApiInstance.interceptors.response.use as jest.Mock).mock.calls[0][1];
    const result = await responseErrorHandler({
      config: { headers: {} },
      response: { status: 401 },
    });

    expect(mockAxios.post).toHaveBeenCalledWith('/backend/auth/refresh-token', {
      token: 'refresh-token',
    });
    expect(localStorage.getItem('auth.srv.token')).toBe('new-access');
    expect(localStorage.getItem('auth.srv.refresh.token')).toBe('new-refresh');
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer new-access' }),
      })
    );
    expect(result).toEqual({ data: { ok: true } });
    expect(axiosModule.authApi).toBe(mockAuthApiInstance);
  });
});
