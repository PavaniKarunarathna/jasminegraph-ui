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

import clusterDataReducer, {
  set_Selected_Cluster,
} from '../../../../../Frontend/src/redux/features/clusterData';
import mockClusterFixture from '../../../fixtures/mock-cluster.json';

const mockCluster = mockClusterFixture;

describe('clusterData slice', () => {
  it('returns initial state', () => {
    expect(clusterDataReducer(undefined, { type: 'unknown' })).toEqual({
      selectedCluster: null,
    });
  });

  it('set_Selected_Cluster sets the selected cluster', () => {
    const result = clusterDataReducer(undefined, set_Selected_Cluster(mockCluster as any));
    expect(result.selectedCluster).toEqual(mockCluster);
  });
});
