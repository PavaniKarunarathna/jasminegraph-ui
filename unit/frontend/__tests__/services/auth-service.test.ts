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

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import axios from 'axios';
import {
  pingBackend,
  checkBackendHealth,
  userLogin,
  registerAdmin,
  registerUser,
  getUserDataByToken
} from '../../../../Frontend/src/services/auth-service';
import mockUserFixture from '../../fixtures/mock-user.json';

const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pingBackend returns true for pong and false on failure', async () => {
    mockedAxios.mockResolvedValueOnce({ data: { message: 'pong' }, status: 200 } as any);
    await expect(pingBackend()).resolves.toBe(true);

    mockedAxios.mockRejectedValueOnce(new Error('Network error'));
    await expect(pingBackend()).resolves.toBe(false);
  });

  it('checkBackendHealth returns true only for 200 ok response', async () => {
    mockedAxios.mockResolvedValueOnce({ data: { status: 'ok' }, status: 200 } as any);
    await expect(checkBackendHealth()).resolves.toBe(true);

    mockedAxios.mockResolvedValueOnce({ data: { status: 'error' }, status: 200 } as any);
    await expect(checkBackendHealth()).resolves.toBe(false);
  });

  it('userLogin posts credentials and returns tokens', async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { accessToken: 'access-token', refreshToken: 'refresh-token' },
    } as any);

    const result = await userLogin(mockUserFixture.email, 'password123');

    expect(mockedAxios).toHaveBeenCalledWith({
      method: 'post',
      url: '/backend/auth/login',
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: mockUserFixture.email,
        password: 'password123',
      },
    });
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('userLogin returns API error message and rejects for network errors', async () => {
    mockedAxios.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    await expect(userLogin('x', 'y')).resolves.toEqual({ message: 'Invalid credentials' });

    mockedAxios.mockRejectedValueOnce(new Error('Network error'));
    await expect(userLogin('x', 'y')).rejects.toBeUndefined();
  });

  it('registerAdmin and registerUser submit correct payloads', async () => {
    mockedAxios.mockResolvedValueOnce({ data: 'Admin registered successfully' } as any);
    mockedAxios.mockResolvedValueOnce({ data: 'User registered successfully' } as any);

    await expect(registerAdmin(mockUserFixture.firstName, mockUserFixture.lastName, mockUserFixture.email, 'adminpass')).resolves.toEqual({
      data: 'Admin registered successfully',
    });
    await expect(registerUser(mockUserFixture.firstName, mockUserFixture.lastName, mockUserFixture.email, 'pass', mockUserFixture.role)).resolves.toEqual({
      data: 'User registered successfully',
    });

    expect(mockedAxios).toHaveBeenNthCalledWith(1, {
      method: 'post',
      url: '/backend/users/admin',
      headers: { 'Content-Type': 'application/json' },
      data: {
        firstName: mockUserFixture.firstName,
        lastName: mockUserFixture.lastName,
        email: mockUserFixture.email,
        password: 'adminpass',
      },
    });
    expect(mockedAxios).toHaveBeenNthCalledWith(2, {
      method: 'post',
      url: '/backend/auth/register',
      headers: { 'Content-Type': 'application/json' },
      data: {
        firstName: mockUserFixture.firstName,
        lastName: mockUserFixture.lastName,
        email: mockUserFixture.email,
        password: 'pass',
        role: mockUserFixture.role,
      },
    });
  });

  it('registerAdmin and registerUser return API messages on response errors', async () => {
    mockedAxios.mockRejectedValueOnce({ response: { data: { message: 'Admin exists' } } });
    mockedAxios.mockRejectedValueOnce({ response: { data: { message: 'User exists' } } });

    await expect(registerAdmin('A', 'B', 'a@b.com', 'p')).resolves.toEqual({ message: 'Admin exists' });
    await expect(registerUser('A', 'B', 'a@b.com', 'p', 'user')).resolves.toEqual({ message: 'User exists' });
  });

  it('getUserDataByToken sends Bearer token and returns user data', async () => {
    const expectedUser = {
      id: mockUserFixture.id,
      email: mockUserFixture.email,
      firstName: mockUserFixture.firstName,
      lastName: mockUserFixture.lastName,
    };
    mockedAxios.mockResolvedValueOnce({ data: expectedUser } as any);

    const result = await getUserDataByToken('jwt-token-123');

    expect(mockedAxios).toHaveBeenCalledWith({
      method: 'get',
      url: '/backend/users/token',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer jwt-token-123',
      },
    });
    expect(result).toEqual({ data: expectedUser });
  });

  it('getUserDataByToken rejects on request failure', async () => {
    mockedAxios.mockRejectedValueOnce(new Error('Invalid token'));
    await expect(getUserDataByToken('bad-token')).rejects.toBeUndefined();
  });
});
