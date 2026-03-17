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

import cacheReducer, {
  set_Users_Cache,
  clear_Users_Cache,
} from '../../../../../Frontend/src/redux/features/cacheSlice';
import mockUserFixture from '../../../fixtures/mock-user.json';

const mockUsers = [
  {
    id: mockUserFixture.id,
    firstName: mockUserFixture.firstName,
    lastName: mockUserFixture.lastName,
    email: mockUserFixture.email,
    role: mockUserFixture.role,
    enabled: true,
  },
];

describe('cacheSlice', () => {
  it('returns initial state', () => {
    expect(cacheReducer(undefined, { type: 'unknown' })).toEqual({
      state: { isUsersCacheLoaded: false },
      users: [],
    });
  });

  it('set_Users_Cache sets users and marks cache loaded', () => {
    const result = cacheReducer(undefined, set_Users_Cache(mockUsers));
    expect(result.users).toEqual(mockUsers);
    expect(result.state.isUsersCacheLoaded).toBe(true);
  });

  it('clear_Users_Cache resets users and marks cache not loaded', () => {
    const loaded = cacheReducer(undefined, set_Users_Cache(mockUsers));
    const cleared = cacheReducer(loaded, clear_Users_Cache());
    expect(cleared.users).toEqual([]);
    expect(cleared.state.isUsersCacheLoaded).toBe(false);
  });
});
