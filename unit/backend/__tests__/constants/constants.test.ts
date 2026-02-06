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

import { HTTP, TIMEOUT } from '../../../../Backend/src/constants/constants';

describe('HTTP constants', () => {
  it('should expose expected HTTP status codes', () => {
    expect(HTTP).toEqual({
      "200": 200,
      "201": 201,
      "400": 400,
      "401": 401,
      "404": 404,
      "422": 422,
      "500": 500,
    });
  });
});

describe('TIMEOUT constants', () => {
  it('should expose expected timeout values', () => {
    expect(TIMEOUT).toEqual({
      hundred: 100,
      default: 5000,
      retryDelayMs: 3000,
    });
  });
});
