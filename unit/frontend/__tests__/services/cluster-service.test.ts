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

const mockAuthApi = jest.fn();

jest.mock('@/services/axios', () => ({
  __esModule: true,
  authApi: (config: any) => mockAuthApi(config),
}));

import mockClusterFixture from '../../fixtures/mock-cluster.json';
import mockUserFixture from '../../fixtures/mock-user.json';
import {
  addNewCluster,
  getAllClusters,
  getCluster,
  getClustersStatusByIds,
  addUserToCluster,
  removeUserFromCluster,
  getClusterProperties,
} from '@/services/cluster-service';

describe('cluster-service', () => {
  const clusterId = String(mockClusterFixture.id);
  const clusterPort = String(mockClusterFixture.port);
  const userId = mockUserFixture.id;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('addNewCluster posts cluster payload and returns response data', async () => {
    mockAuthApi.mockResolvedValueOnce({ data: 'Cluster created' });

    const result = await addNewCluster(mockClusterFixture.name, mockClusterFixture.description, mockClusterFixture.host, clusterPort, 'token-1');

    expect(mockAuthApi).toHaveBeenCalledWith({
      method: 'post',
      url: '/backend/clusters',
      headers: { Authorization: 'Bearer token-1' },
      data: {
        name: mockClusterFixture.name,
        description: mockClusterFixture.description,
        host: mockClusterFixture.host,
        port: clusterPort,
      },
    });
    expect(result).toEqual({ data: 'Cluster created' });
  });

  it('addNewCluster returns backend error payload when present', async () => {
    mockAuthApi.mockRejectedValueOnce({
      response: { data: { errorCode: 'CLUSTER_EXISTS', message: 'Cluster already exists' } },
    });

    const result = await addNewCluster('A', 'B', 'C', '1', 'token-1');
    expect(result).toEqual({ errorCode: 'CLUSTER_EXISTS', message: 'Cluster already exists' });
  });

  it('getAllClusters requires a token and returns wrapped data when successful', async () => {
    await expect(getAllClusters(null)).rejects.toThrow('Authentication token is required');

    mockAuthApi.mockResolvedValueOnce({ data: { data: [mockClusterFixture] } });
    await expect(getAllClusters('token-1')).resolves.toEqual({ data: [mockClusterFixture] });
  });

  it('getCluster fetches a single cluster by id', async () => {
    mockAuthApi.mockResolvedValueOnce({ data: { data: mockClusterFixture } });

    const result = await getCluster(clusterId, 'token-1');

    expect(mockAuthApi).toHaveBeenCalledWith({
      method: 'get',
      url: `/backend/clusters/${clusterId}`,
      headers: { Authorization: 'Bearer token-1' },
    });
    expect(result).toEqual({ data: mockClusterFixture });
  });

  it('getClustersStatusByIds posts ids and returns raw backend result', async () => {
    mockAuthApi.mockResolvedValueOnce({ data: { statuses: [{ id: 1, status: 'active' }] } });

    await expect(getClustersStatusByIds('token-1', [1])).resolves.toEqual({
      statuses: [{ id: 1, status: 'active' }],
    });
  });

  it('addUserToCluster and removeUserFromCluster post membership changes', async () => {
    mockAuthApi.mockResolvedValueOnce({ data: { data: 'added' } });
    mockAuthApi.mockResolvedValueOnce({ data: { data: 'removed' } });

    await expect(addUserToCluster(userId, clusterId, 'token-1')).resolves.toEqual({ data: 'added' });
    await expect(removeUserFromCluster(userId, clusterId, 'token-1')).resolves.toEqual({ data: 'removed' });
  });

  it('getClusterProperties fetches graph info for a cluster', async () => {
    mockAuthApi.mockResolvedValueOnce({ data: { graphCount: 2 } });

    await expect(getClusterProperties(clusterId)).resolves.toEqual({ data: { graphCount: 2 } });

    expect(mockAuthApi).toHaveBeenCalledWith({
      method: 'get',
      url: '/backend/graph/info',
      headers: { 'Cluster-ID': clusterId },
    });
  });
});
