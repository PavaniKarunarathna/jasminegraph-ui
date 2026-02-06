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

jest.mock('axios');
jest.mock('jsonwebtoken');

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getAdminToken } from '../../../../Backend/src/utils/keycloak-admin-token';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Keycloak Admin Token Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminToken', () => {
    let mockCurrentTime: number;

    beforeEach(() => {
      mockCurrentTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(mockCurrentTime);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw error when JWT decode fails', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'some.token' },
      });
      mockedJwt.decode.mockReturnValue(null);

      await expect(getAdminToken()).rejects.toThrow('Failed to decode admin token');
    });

    it('should throw error when decoded token has no expiry', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'some.token' },
      });
      mockedJwt.decode.mockReturnValue({});

      await expect(getAdminToken()).rejects.toThrow('Failed to decode admin token');
    });

    it('should handle axios request failure', async () => {
      const errorMessage = 'Network error';
      mockedAxios.post.mockRejectedValue(new Error(errorMessage));

      await expect(getAdminToken()).rejects.toThrow(errorMessage);
    });
  });
});
