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

import { ErrorCode, ErrorMsg } from '../../../../Backend/src/constants/error.constants';

describe('Error constants', () => {
  it('should expose expected error codes', () => {
    expect(ErrorCode).toEqual({
      NoResponseFromServer: 'j-001',
      ServerError: 'j-002',
      ClusterNotFound: 'j-003',
      UniqueViolation: '23505',
    });
  });

  it('should expose expected error messages', () => {
    expect(ErrorMsg).toEqual({
      NoResponseFromServer:
        'Trying to connect to server on IP on this port, No response from server',
      ServerError: 'Server error',
      ClusterNotFound: 'Cluster not found',
    });
  });

  it('should have matching keys between ErrorCode and ErrorMsg', () => {
    const codeKeys = Object.keys(ErrorCode).filter(
      key => key !== 'UniqueViolation'
    );
    const msgKeys = Object.keys(ErrorMsg);

    expect(codeKeys.sort()).toEqual(msgKeys.sort());
  });
});
