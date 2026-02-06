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
import { getAdminToken } from '../../../../Backend/src/utils/keycloak-admin-token';
import { extractErrorDetails } from '../../../../Backend/src/utils/error-handler';
import {
  registerAdminUser,
  getAllUsers,
  getUser,
  updateUser,
  getUserByToken,
  deleteUser,
} from '../../../../Backend/src/controllers/user.controller';
import { validUserData } from '../../fixtures/user';

jest.mock('axios');
jest.mock('../../../../Backend/src/utils/keycloak-admin-token');
jest.mock('../../../../Backend/src/utils/error-handler');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetAdminToken = getAdminToken as jest.MockedFunction<typeof getAdminToken>;
const mockedExtractErrorDetails = extractErrorDetails as jest.MockedFunction<typeof extractErrorDetails>;

describe('User Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('registerAdminUser', () => {
    it('should register admin user successfully', async () => {
      req.body = validUserData;
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.post.mockResolvedValue({ status: 201 });

      await registerAdminUser(req as Request, res as Response);

      expect(mockedGetAdminToken).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://keycloak:8080/admin/realms/jasminegraph/users',
        expect.objectContaining({
          username: validUserData.email,
          email: validUserData.email,
          firstName: validUserData.firstName,
          lastName: validUserData.lastName,
          enabled: true,
          credentials: [{ type: 'password', value: validUserData.password, temporary: false }],
          attributes: { role: ['admin'] },
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
        })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        email: validUserData.email,
        role: 'admin',
      });
    });

    it('should return 422 if required fields are missing', async () => {
      req.body = { email: 'admin@example.com' }; // missing others

      await registerAdminUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Email address, first name, last name, and password are required',
      });
      expect(mockedGetAdminToken).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle failure if Keycloak response is not 201', async () => {
      req.body = validUserData;
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.post.mockResolvedValue({ status: 400, data: { error: 'failed' } });

      await registerAdminUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Failed to create admin user in Keycloak',
      });
    });

    it('should handle errors and call extractErrorDetails', async () => {
      req.body = validUserData;
      const error = new Error('Some error');
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.post.mockRejectedValue(error);
      mockedExtractErrorDetails.mockReturnValue('extracted error details');

      await registerAdminUser(req as Request, res as Response);

      expect(mockedExtractErrorDetails).toHaveBeenCalledWith(error, 'REGISTER ADMIN USER');
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Failed to register admin user.',
        error: 'extracted error details',
      });
    });
  });

  describe('getAllUsers', () => {
    it('should fetch all users successfully', async () => {
      const fakeUsers = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
          enabled: true,
          attributes: { role: ['admin'] },
        },
      ];
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.get.mockResolvedValue({ data: fakeUsers });

      await getAllUsers(req as Request, res as Response);

      expect(mockedGetAdminToken).toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://keycloak:8080/admin/realms/jasminegraph/users',
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
        })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data: [
          {
            id: '1',
            username: 'user1',
            email: 'user1@example.com',
            firstName: 'User',
            lastName: 'One',
            enabled: true,
            role: 'admin',
          },
        ],
      });
    });

    it('should handle errors in getAllUsers', async () => {
      const error = new Error('Failed');
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.get.mockRejectedValue(error);
      mockedExtractErrorDetails.mockReturnValue('extracted error');

      await getAllUsers(req as Request, res as Response);

      expect(mockedExtractErrorDetails).toHaveBeenCalledWith(error, 'GET ALL USERS');
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Failed to fetch users.',
        error: 'extracted error',
      });
    });
  });

  describe('getUser', () => {
    const userId = '123';
    beforeEach(() => {
      req.params = { id: userId };
    });

    it('should fetch a user successfully', async () => {
      const user = { id: userId, username: 'user', email: 'user@example.com' };
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.get.mockResolvedValue({ data: user });

      await getUser(req as Request, res as Response);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://keycloak:8080/admin/realms/jasminegraph/users/${userId}`,
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: user });
    });

    it('should return 404 if user not found', async () => {
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.get.mockResolvedValue({ data: null });

      await getUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: `User with id "${userId}" not found.` });
    });

    it('should handle errors during getUser', async () => {
      const error = new Error('Error fetching');
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.get.mockRejectedValue(error);
      mockedExtractErrorDetails.mockReturnValue('extracted error');

      await getUser(req as Request, res as Response);

      expect(mockedExtractErrorDetails).toHaveBeenCalledWith(error, 'GET USER');
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: `Unable to fetch user with id "${userId}". Please check if the user exists or try again later.`,
        error: 'extracted error',
      });
    });
  });

  describe('updateUser', () => {
    const userId = '123';
    beforeEach(() => {
      req.params = { id: userId };
    });

    it('should update user successfully', async () => {
      req.body = {
        firstName: 'NewFirst',
        lastName: 'NewLast',
        role: 'admin',
        enabled: true,
      };
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.put.mockResolvedValue({});
      mockedAxios.get.mockResolvedValue({ data: req.body });

      await updateUser(req as Request, res as Response);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        `http://keycloak:8080/admin/realms/jasminegraph/users/${userId}`,
        expect.objectContaining({
          enabled: true,
          firstName: 'NewFirst',
          lastName: 'NewLast',
          attributes: { role: ['admin'] },
        }),
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: req.body });
    });

    it('should return 422 if required fields missing', async () => {
      req.body = { firstName: 'NewFirst' }; // missing lastName, role

      await updateUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'The fields first name, last name, and role are required',
      });
      expect(mockedGetAdminToken).not.toHaveBeenCalled();
      expect(mockedAxios.put).not.toHaveBeenCalled();
    });

    it('should handle errors during updateUser', async () => {
      const error = new Error('Update failed');
      req.body = {
        firstName: 'NewFirst',
        lastName: 'NewLast',
        role: 'admin',
      };
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.put.mockRejectedValue(error);
      mockedExtractErrorDetails.mockReturnValue('extracted error');

      await updateUser(req as Request, res as Response);

      expect(mockedExtractErrorDetails).toHaveBeenCalledWith(error, 'UPDATE USER');
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: `Failed to update user with id "${userId}".`,
        error: 'extracted error',
      });
    });
  });

  describe('getUserByToken', () => {
    it('should get user info successfully from token', async () => {
      const token = 'valid.jwt.token';
      const userInfo = { sub: 'userid' };
      const userDetails = {
        id: 'userid',
        username: 'username',
        email: 'email@example.com',
        firstName: 'First',
        lastName: 'Last',
        enabled: true,
        attributes: { role: ['admin'] },
      };
      req.headers = { authorization: `Bearer ${token}` };
      mockedAxios.get
        .mockResolvedValueOnce({ data: userInfo }) 
        .mockResolvedValueOnce({ data: userDetails });
      mockedGetAdminToken.mockResolvedValue('admin-token');

      await getUserByToken(req as Request, res as Response);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://keycloak:8080/realms/jasminegraph/protocol/openid-connect/userinfo',
        expect.objectContaining({
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://keycloak:8080/admin/realms/jasminegraph/users/${userInfo.sub}`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer admin-token' },
        })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data: {
          id: userDetails.id,
          username: userDetails.username,
          email: userDetails.email,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          enabled: userDetails.enabled,
          role: 'admin',
        },
      });
    });

    it('should return 401 if authorization header missing', async () => {
      req.headers = {};

      await getUserByToken(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Authorization header missing' });
    });

    it('should return 401 if bearer token missing', async () => {
      req.headers = { authorization: 'Bearer' };

      await getUserByToken(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Bearer token missing' });
    });

    it('should return 401 on error', async () => {
      req.headers = { authorization: 'Bearer invalid.token' };
      mockedAxios.get.mockRejectedValue(new Error('Invalid token'));

      await getUserByToken(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });
  });

  describe('deleteUser', () => {
    const userId = 'user1';
    beforeEach(() => {
      req.params = { id: userId };
    });

    it('should delete user successfully', async () => {
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.delete.mockResolvedValue({});

      await deleteUser(req as Request, res as Response);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `http://keycloak:8080/admin/realms/jasminegraph/users/${userId}`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
        })
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: `User deleted successfully. ID: ${userId}` });
    });

    it('should handle errors during deleteUser', async () => {
      const error = new Error('Delete failed');
      mockedGetAdminToken.mockResolvedValue('token');
      mockedAxios.delete.mockRejectedValue(error);
      mockedExtractErrorDetails.mockReturnValue('extracted error');

      await deleteUser(req as Request, res as Response);

      expect(mockedExtractErrorDetails).toHaveBeenCalledWith(error, 'DELETE USER');
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: `Failed to delete user with id "${userId}".`,
        error: 'extracted error',
      });
    });
  });
});
