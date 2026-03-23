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

const mockAuthApi = jest.fn();
const mockIsAxiosError = jest.fn((error) => Boolean(error?.isAxiosError));

jest.mock('../../../../Frontend/src/services/axios', () => ({
  __esModule: true,
  authApi: (config: any) => mockAuthApi(config),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: { isAxiosError: (error: any) => mockIsAxiosError(error) },
}));

import {
  getGraphList,
  getKGConstructionMetaData,
  getOnProgressKGConstructionMetaData,
  constructKG,
  stopConstructKG,
  deleteGraph,
} from '../../../../Frontend/src/services/graph-service';
import mockGraphData from '../../fixtures/mock-graph-data.json';
import mockClusterFixture from '../../fixtures/mock-cluster.json';

describe('graph-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('selectedCluster', String(mockClusterFixture.id));
  });

  it('getGraphList requests graph list with selected cluster header', async () => {
    mockAuthApi.mockResolvedValueOnce({ data: [mockGraphData.metadata] });

    await expect(getGraphList()).resolves.toEqual({ data: [mockGraphData.metadata] });
    expect(mockAuthApi).toHaveBeenCalledWith({
      method: 'get',
      url: '/backend/graph/list',
      headers: { 'Cluster-ID': String(mockClusterFixture.id) },
    });
  });

  it('gets KG construction metadata and progress metadata', async () => {
    mockAuthApi.mockResolvedValueOnce({ data: { data: [{ id: 'kg-1' }] } });
    mockAuthApi.mockResolvedValueOnce({ data: { data: [{ id: 'kg-2' }] } });

    await expect(getKGConstructionMetaData('graph-1')).resolves.toEqual({ data: [{ id: 'kg-1' }] });
    await expect(getOnProgressKGConstructionMetaData()).resolves.toEqual({ data: [{ id: 'kg-2' }] });
  });

  it('constructKG returns normalized success payload', async () => {
    mockAuthApi.mockResolvedValueOnce({
      status: 202,
      data: { message: 'Started', data: [{ id: 'job-1' }] },
    });

    const result = await constructKG('1.1.1.1', '9000', '/data', 'runner', 'engine', 'model', 512, 'RUNNING', 'g1');

    expect(result).toEqual({
      status: 202,
      message: 'Started',
      data: [{ id: 'job-1' }],
    });
  });

  it('constructKG handles axios errors with backend message', async () => {
    mockAuthApi.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { message: 'HDFS validation failed' } },
    });

    await expect(constructKG(null, null, null, null, null, null, null, null, null)).resolves.toEqual({
      status: 400,
      message: 'HDFS validation failed',
      data: null,
    });
  });

  it('stopConstructKG returns backend payload and deleteGraph wraps result in data', async () => {
    mockAuthApi.mockResolvedValueOnce({ data: { data: [{ id: 'stopped' }] } });
    mockAuthApi.mockResolvedValueOnce({ data: { success: true } });

    await expect(stopConstructKG('graph-1', 'STOPPED')).resolves.toEqual({ data: [{ id: 'stopped' }] });
    await expect(deleteGraph('graph-1')).resolves.toEqual({ data: { success: true } });
  });
});
