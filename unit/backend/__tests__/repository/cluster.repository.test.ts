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

import { pool } from '../../../../Backend/src/databaseConnection';
import {
  createClusterRepo,
  getAllClustersRepo,
  getClusterByIdRepo,
  addUserToClusterRepo,
  removeUserFromClusterRepo,
  getMyClustersRepo,
} from '../../../../Backend/src/repository/cluster.repository';
import {
  validClusterData,
  mockUserId,
  mockCreatedCluster,
  mockClusters,
  mockCluster,
} from '../../fixtures/cluster';

jest.mock('../../../../Backend/src/databaseConnection', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Cluster Repository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createClusterRepo', () => {
    it('should insert a cluster and return it', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockCreatedCluster] });

      const result = await createClusterRepo({
        ...validClusterData,
        user_ids: [],
        cluster_owner: mockUserId,
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clusters'),
        [validClusterData.name, validClusterData.description, validClusterData.host, validClusterData.port, [], mockUserId]
      );

      expect(result).toEqual(mockCreatedCluster);
    });
  });

  describe('getAllClustersRepo', () => {
    it('should return all clusters ordered by created_at DESC', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockClusters });

      const result = await getAllClustersRepo();

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM clusters ORDER BY created_at DESC');
      expect(result).toEqual(mockClusters);
    });
  });

  describe('getClusterByIdRepo', () => {
    it('should return a cluster by id if found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockCluster] });

      const result = await getClusterByIdRepo(mockCluster.id);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM clusters WHERE id = $1', [mockCluster.id]);
      expect(result).toEqual(mockCluster);
    });

    it('should return null if cluster not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await getClusterByIdRepo(999);

      expect(result).toBeNull();
    });
  });

  describe('addUserToClusterRepo', () => {
    it('should append a user ID to user_ids and return the updated cluster', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockCluster] });

      const result = await addUserToClusterRepo(mockCluster.id, 'newUser');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE clusters SET user_ids = array_append'),
        ['newUser', mockCluster.id]
      );

      expect(result).toEqual(mockCluster);
    });

    it('should return null if cluster not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await addUserToClusterRepo(999, 'user');

      expect(result).toBeNull();
    });
  });

  describe('removeUserFromClusterRepo', () => {
    it('should remove a user ID from user_ids and return the updated cluster', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockCluster] });

      const result = await removeUserFromClusterRepo(mockCluster.id, 'userToRemove');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE clusters SET user_ids = array_remove'),
        ['userToRemove', mockCluster.id]
      );

      expect(result).toEqual(mockCluster);
    });

    it('should return null if cluster not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await removeUserFromClusterRepo(999, 'user');

      expect(result).toBeNull();
    });
  });

  describe('getMyClustersRepo', () => {
    it('should return clusters where user is owner or member', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockClusters });

      const result = await getMyClustersRepo(mockUserId);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM clusters WHERE cluster_owner = $1 OR $1 = ANY(user_ids)'),
        [mockUserId]
      );

      expect(result).toEqual(mockClusters);
    });
  });
});
