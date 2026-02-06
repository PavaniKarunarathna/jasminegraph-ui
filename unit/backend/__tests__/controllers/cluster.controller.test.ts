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
import * as clusterController from '../../../../Backend/src/controllers/cluster.controller';
import * as clusterRepo from '../../../../Backend/src/repository/cluster.repository';
import {
  validClusterData,
  mockUserId,
  mockCreatedCluster,
  mockClusters,
  mockCluster
} from '../../fixtures/cluster';

jest.mock('../../../../Backend/src/repository/cluster.repository');

const mockedCreateClusterRepo = clusterRepo.createClusterRepo as jest.MockedFunction<typeof clusterRepo.createClusterRepo>;
const mockedGetAllClustersRepo = clusterRepo.getAllClustersRepo as jest.MockedFunction<typeof clusterRepo.getAllClustersRepo>;
const mockedGetClusterByIdRepo = clusterRepo.getClusterByIdRepo as jest.MockedFunction<typeof clusterRepo.getClusterByIdRepo>;
const mockedAddUserToClusterRepo = clusterRepo.addUserToClusterRepo as jest.MockedFunction<typeof clusterRepo.addUserToClusterRepo>;
const mockedRemoveUserFromClusterRepo = clusterRepo.removeUserFromClusterRepo as jest.MockedFunction<typeof clusterRepo.removeUserFromClusterRepo>;

describe('Cluster Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: jsonMock });

    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
      send: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('addNewCluster', () => {
    it('creates cluster successfully', async () => {
      req.body = validClusterData;
      (req as any).auth = { sub: mockUserId };
      mockedCreateClusterRepo.mockResolvedValue(mockCreatedCluster);

      await clusterController.addNewCluster(req as Request, res as Response);

      expect(mockedCreateClusterRepo).toHaveBeenCalledWith({
        ...validClusterData,
        user_ids: [],
        cluster_owner: mockUserId,
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ data: mockCreatedCluster });
    });

    it('returns 401 if no userId in token', async () => {
      req.body = validClusterData;
      (req as any).auth = {};

      await clusterController.addNewCluster(req as Request, res as Response);

      expect(mockedCreateClusterRepo).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized: User ID not found in token' });
    });

    it('handles duplicate host/port error', async () => {
      req.body = validClusterData;
      (req as any).auth = { sub: mockUserId };
      const duplicateError = new Error('Duplicate');
      (duplicateError as any).code = '23505';
      mockedCreateClusterRepo.mockRejectedValue(duplicateError);

      await clusterController.addNewCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        errorCode: 'DUPLICATE_HOST_PORT',
        message: 'A cluster with the same host and port already exists. Please use a different combination.',
      });
    });

    it('handles generic DB error', async () => {
      req.body = validClusterData;
      (req as any).auth = { sub: mockUserId };
      mockedCreateClusterRepo.mockRejectedValue(new Error('DB failure'));

      await clusterController.addNewCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal Server Error: Unable to create the cluster.',
        error: 'DB failure',
      });
    });
  });

  describe('getAllClusters', () => {
    it('returns all clusters', async () => {
      mockedGetAllClustersRepo.mockResolvedValue(mockClusters);

      await clusterController.getAllClusters(req as Request, res as Response);

      expect(mockedGetAllClustersRepo).toHaveBeenCalledTimes(1);
      expect(jsonMock).toHaveBeenCalledWith({ data: mockClusters });
    });

    it('handles DB error', async () => {
      mockedGetAllClustersRepo.mockRejectedValue(new Error('DB error'));

      await clusterController.getAllClusters(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal Server Error: Unable to fetch clusters.',
        error: 'DB error',
      });
    });
  });

  describe('getCluster', () => {
    it('returns cluster if found', async () => {
      req.params = { id: '1' };
      mockedGetClusterByIdRepo.mockResolvedValue(mockCluster);

      await clusterController.getCluster(req as Request, res as Response);

      expect(mockedGetClusterByIdRepo).toHaveBeenCalledWith(1);
      expect(jsonMock).toHaveBeenCalledWith({ data: mockCluster });
    });

    it('returns 404 if cluster not found', async () => {
      req.params = { id: '999' };
      mockedGetClusterByIdRepo.mockResolvedValue(null);

      await clusterController.getCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Cluster with id "999" not found.' });
    });

    it('returns 400 if invalid id param', async () => {
      req.params = { id: 'abc' };

      await clusterController.getCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid cluster ID' });
    });

    it('handles DB error', async () => {
      req.params = { id: '1' };
      mockedGetClusterByIdRepo.mockRejectedValue(new Error('DB error'));

      await clusterController.getCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal Server Error: Unable to get the cluster.',
        error: 'DB error',
      });
    });
  });

  describe('addUserToCluster', () => {
    it('successfully adds user', async () => {
      req.body = { clusterID: '1', userID: 'user-2' };
      mockedAddUserToClusterRepo.mockResolvedValue(mockCluster);

      await clusterController.addUserToCluster(req as Request, res as Response);

      expect(mockedAddUserToClusterRepo).toHaveBeenCalledWith(1, 'user-2');
      expect(jsonMock).toHaveBeenCalledWith({ data: mockCluster });
    });

    it('returns 404 if cluster not found', async () => {
      req.body = { clusterID: '999', userID: 'user-2' };
      mockedAddUserToClusterRepo.mockResolvedValue(null);

      await clusterController.addUserToCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Cluster with id "999" not found.' });
    });

    it('handles DB error', async () => {
      req.body = { clusterID: '1', userID: 'user-2' };
      mockedAddUserToClusterRepo.mockRejectedValue(new Error('DB error'));

      await clusterController.addUserToCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal Server Error: Unable to add the user to the cluster.',
        error: 'DB error',
      });
    });
  });

  describe('removeUserFromCluster', () => {
    it('successfully removes user', async () => {
      req.body = { clusterID: '1', userID: 'user-1' };
      mockedRemoveUserFromClusterRepo.mockResolvedValue(mockCluster);

      await clusterController.removeUserFromCluster(req as Request, res as Response);

      expect(mockedRemoveUserFromClusterRepo).toHaveBeenCalledWith(1, 'user-1');
      expect(jsonMock).toHaveBeenCalledWith({ data: mockCluster });
    });

    it('returns 404 if cluster not found', async () => {
      req.body = { clusterID: '999', userID: 'user-1' };
      mockedRemoveUserFromClusterRepo.mockResolvedValue(null);

      await clusterController.removeUserFromCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Cluster with id "999" not found.' });
    });

    it('handles DB error', async () => {
      req.body = { clusterID: '1', userID: 'user-1' };
      mockedRemoveUserFromClusterRepo.mockRejectedValue(new Error('DB error'));

      await clusterController.removeUserFromCluster(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal Server Error: Unable to remove the user from the cluster.',
        error: 'DB error',
      });
    });
  });
});
