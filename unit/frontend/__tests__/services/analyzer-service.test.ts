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

import { AnalyzeOptions } from '../../../../Frontend/src/data/analyze-data';

const mockAuthApi = jest.fn();

jest.mock('../../../../Frontend/src/services/axios', () => ({
  __esModule: true,
  authApi: (config: any) => mockAuthApi(config),
}));

import { analyzeGraph } from '../../../../Frontend/src/services/analyzer-service';

describe('analyzer-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts triangle count analysis to the correct endpoint', async () => {
    const values = { method: AnalyzeOptions.TRIANGLECOUNT, priority: '1' };
    mockAuthApi.mockResolvedValue({ data: { total: 4 } });

    const result = await analyzeGraph(values);

    expect(mockAuthApi).toHaveBeenCalledWith({
      method: 'post',
      url: '/backend/graph/analyze/trianglecount',
      headers: {
        'Content-Type': 'application/json',
      },
      data: values,
    });
    expect(result).toEqual({ data: { total: 4 } });
  });
});
