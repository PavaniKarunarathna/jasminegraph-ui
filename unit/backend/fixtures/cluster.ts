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

export const validClusterData = {
  name: 'Test Cluster',
  description: 'A test cluster',
  host: 'localhost',
  port: 8080,
};

export const mockUserId = 'user-123';

export const mockCreatedCluster = {
  id: 1,
  ...validClusterData,
  user_ids: [],
  cluster_owner: mockUserId,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockClusters = [
  {
    id: 1,
    name: 'Cluster 1',
    description: 'First cluster',
    host: 'localhost',
    port: 8080,
    user_ids: ['user-1', 'user-2'],
    cluster_owner: 'user-1',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    name: 'Cluster 2',
    description: 'Second cluster',
    host: 'remote-host',
    port: 8081,
    user_ids: ['user-1'],
    cluster_owner: 'user-2',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z'
  }
];

export const mockCluster = {
  id: 1,
  name: 'Test Cluster',
  description: 'A test cluster',
  host: 'localhost',
  port: 8080,
  user_ids: ['user-1'],
  cluster_owner: 'user-1',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
};
