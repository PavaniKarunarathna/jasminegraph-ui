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

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import axios from 'axios';
import mockUserFixture from '../../fixtures/mock-user.json';

const mockedAxios = axios as jest.MockedFunction<typeof axios>;

import { getAllUsers } from '../../../../Frontend/src/services/user-service';

describe('user-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllUsers fetches users and returns wrapped data', async () => {
    mockedAxios.mockResolvedValueOnce({ data: { data: [mockUserFixture] } } as any);

    const result = await getAllUsers();

    expect(mockedAxios).toHaveBeenCalledWith({
      method: 'get',
      url: '/backend/users',
    });
    expect(result).toEqual({ data: [mockUserFixture] });
  });
});
