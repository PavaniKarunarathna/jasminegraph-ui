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

import { Request, Response } from 'express';
import axios from 'axios';
import { register, login, refreshToken } from '../../../../Backend/src/controllers/auth.controller';
import { getAdminToken } from '../../../../Backend/src/utils/keycloak-admin-token';
import { validUserData, validLoginData } from '../../fixtures/user';

jest.mock('axios');
jest.mock('../../../../Backend/src/utils/keycloak-admin-token');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetAdminToken = getAdminToken as jest.MockedFunction<typeof getAdminToken>;

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson, send: responseJson });

    mockRequest = {};
    mockResponse = {
      status: responseStatus,
      json: responseJson,
      send: responseJson,
    };

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user with valid data', async () => {
      mockRequest.body = validUserData;
      mockedGetAdminToken.mockResolvedValue('admin-token-123');
      mockedAxios.post.mockResolvedValue({ status: 201, data: {} });

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockedGetAdminToken).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://keycloak:8080/admin/realms/jasminegraph/users',
        expect.objectContaining({
          username: validUserData.email,
          email: validUserData.email,
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          enabled: true,
          credentials: [{ type: 'password', value: validUserData.password, temporary: false }],
          attributes: { role: [validUserData.role] },
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bearer admin-token-123' },
        })
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        email: validUserData.email,
        role: validUserData.role,
      });
    });

    it('should return 422 when required fields are missing', async () => {
      mockRequest.body = { email: 'test@example.com' }; // missing others

      await register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(422);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'Email address, first name, last name, and password are required',
      });
      expect(mockedGetAdminToken).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle Keycloak registration failure (non-201 status)', async () => {
      mockRequest.body = validUserData;
      mockedGetAdminToken.mockResolvedValue('admin-token-123');
      mockedAxios.post.mockResolvedValue({ status: 400, data: { error: 'User exists' } });

      await register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: `Failed to create user ${validUserData.email} in Keycloak`,
      });
    });

    it('should handle network errors during registration', async () => {
      mockRequest.body = validUserData;
      mockedGetAdminToken.mockResolvedValue('admin-token-123');
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.stringContaining('Server error: Network error'));
    });

    it('should handle admin token retrieval failure', async () => {
      mockRequest.body = validUserData;
      mockedGetAdminToken.mockRejectedValue(new Error('Token error'));

      await register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.stringContaining('Server error: Token error'));
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      mockRequest.body = validLoginData;
      const mockTokenResponse = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
      };
      mockedAxios.post.mockResolvedValue({ data: mockTokenResponse });

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://keycloak:8080/realms/jasminegraph/protocol/openid-connect/token',
        expect.any(String),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      expect(responseJson).toHaveBeenCalledWith({
        accessToken: mockTokenResponse.access_token,
        refreshToken: mockTokenResponse.refresh_token,
      });
    });

    it('should return 422 when email or password is missing', async () => {
      mockRequest.body = { email: 'test@example.com' }; // missing password

      await login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(422);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'Email and password are required',
      });
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle authentication failure (invalid credentials)', async () => {
      mockRequest.body = validLoginData;
      mockedAxios.post.mockRejectedValue({
        response: { status: 401, data: { error: 'invalid_grant' } },
      });

      await login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith('Invalid credentials');
    });

    it('should handle network errors during login', async () => {
      mockRequest.body = validLoginData;
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(expect.stringContaining('Server error: Network error'));
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      mockRequest.body = { refreshToken: 'valid-refresh-token' };
      const mockResponseData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };
      mockedAxios.post.mockResolvedValue({ data: mockResponseData });

      await refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://keycloak:8080/realms/jasminegraph/protocol/openid-connect/token',
        expect.any(String),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      expect(responseJson).toHaveBeenCalledWith({
        accessToken: mockResponseData.access_token,
        refreshToken: mockResponseData.refresh_token,
        expiresIn: mockResponseData.expires_in,
      });
    });

    it('should return 401 when refresh token is missing', async () => {
      mockRequest.body = {};

      await refreshToken(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Refresh token is required' });
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle invalid or expired refresh token', async () => {
      mockRequest.body = { refreshToken: 'invalid-token' };
      mockedAxios.post.mockRejectedValue({
        response: { status: 401, data: { error: 'invalid_token' } },
      });

      await refreshToken(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Invalid or expired refresh token' });
    });
  });
});
