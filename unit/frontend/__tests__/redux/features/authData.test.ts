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

import authDataReducer, {
  authDataSlice,
  set_Is_User_Authenticated,
  set_User_Data,
  set_Clear_User_Data,
} from '@/redux/features/authData';
import mockUserFixture from '../../../fixtures/mock-user.json';

describe('authData slice', () => {
  const initialState = {
    isUserAuthenticated: false,
    isUserDataFetched: false,
    userData: {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      enabled: false,
    },
  };

  const mockUserData = {
    id: mockUserFixture.id,
    firstName: mockUserFixture.firstName,
    lastName: mockUserFixture.lastName,
    email: mockUserFixture.email,
    role: mockUserFixture.role,
    enabled: true,
  };

  it('returns the initial state', () => {
    expect(authDataReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('sets authentication state', () => {
    const authenticated = authDataReducer(undefined, set_Is_User_Authenticated(true));
    const unauthenticated = authDataReducer(authenticated, set_Is_User_Authenticated(false));

    expect(authenticated.isUserAuthenticated).toBe(true);
    expect(unauthenticated.isUserAuthenticated).toBe(false);
  });

  it('sets user data and marks data as fetched', () => {
    const result = authDataReducer(undefined, set_User_Data(mockUserData as any));

    expect(result.userData).toEqual(mockUserData);
    expect(result.isUserDataFetched).toBe(true);
    expect(result.isUserAuthenticated).toBe(false);
  });

  it('clears user data and resets fetched flag', () => {
    const withUserData = authDataReducer(undefined, set_User_Data(mockUserData as any));
    const cleared = authDataReducer(withUserData, set_Clear_User_Data());

    expect(cleared.userData).toEqual(initialState.userData);
    expect(cleared.isUserDataFetched).toBe(false);
  });

  it('supports login then logout transition', () => {
    let state = authDataReducer(undefined, { type: 'unknown' });
    state = authDataReducer(state, set_Is_User_Authenticated(true));
    state = authDataReducer(state, set_User_Data(mockUserData as any));

    expect(state.isUserAuthenticated).toBe(true);
    expect(state.isUserDataFetched).toBe(true);
    expect(state.userData).toEqual(mockUserData);

    state = authDataReducer(state, set_Clear_User_Data());
    state = authDataReducer(state, set_Is_User_Authenticated(false));

    expect(state).toEqual(initialState);
  });

  it('exports expected slice metadata and action types', () => {
    expect(authDataSlice.name).toBe('authData');
    expect(set_Is_User_Authenticated(true).type).toBe('authData/set_Is_User_Authenticated');
    expect(set_User_Data(mockUserData as any).type).toBe('authData/set_User_Data');
    expect(set_Clear_User_Data().type).toBe('authData/set_Clear_User_Data');
  });
});
