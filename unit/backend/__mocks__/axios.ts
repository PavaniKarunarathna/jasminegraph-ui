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

import { AxiosInstance } from 'axios';

const mockAxios = {
  get: jest.fn() as jest.Mock,
  post: jest.fn() as jest.Mock,
  put: jest.fn() as jest.Mock,
  delete: jest.fn() as jest.Mock,
  patch: jest.fn() as jest.Mock,
  create: jest.fn(() => mockAxios) as jest.Mock,
  defaults: {
    baseURL: '',
    headers: { common: {} },
  },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
  CancelToken: {
    source: jest.fn(),
  },
  isAxiosError: jest.fn(() => false),
} as unknown as AxiosInstance;

export default mockAxios;
