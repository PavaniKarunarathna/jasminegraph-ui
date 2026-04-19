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

import queryDataReducer, {
  add_query_result,
  clear_result,
  clear_visualize_data,
} from '@/redux/features/queryData';

const initialState = {
  messagePool: {},
  visualizeData: { node: [], edge: [], render: false, updateProgress: false },
  inDegreeDataPool: [],
  outDegreeDataPool: [],
  uploadBytes: { type: '', updates: [], timestamp: '' },
};

describe('queryData slice', () => {
  it('returns initial state', () => {
    expect(queryDataReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('add_query_result appends payload to messagePool key', () => {
    const result = queryDataReducer(undefined, add_query_result({ q1: { id: 'n1' } }));
    expect(result.messagePool['q1']).toHaveLength(1);
    expect(result.messagePool['q1'][0]).toEqual({ id: 'n1' });
  });

  it('clear_result empties the messagePool', () => {
    const withData = queryDataReducer(undefined, add_query_result({ q1: { id: 'n1' } }));
    const cleared = queryDataReducer(withData, clear_result());
    expect(cleared.messagePool).toEqual({});
  });

  it('clear_visualize_data resets visualizeData to empty', () => {
    const withViz = {
      ...initialState,
      visualizeData: { node: [{ id: 1 }], edge: [], render: true, updateProgress: true },
    };
    const cleared = queryDataReducer(withViz, clear_visualize_data());
    expect(cleared.visualizeData).toEqual({ node: [], edge: [], render: false, updateProgress: false });
  });
});
