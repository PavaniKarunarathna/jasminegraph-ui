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

import { Request, Response, NextFunction } from 'express';
import clusterMiddleware from '../../../../Backend/src/middleware/cluster.middleware';

describe('clusterMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    req = {
      header: jest.fn(),
    };
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ send: sendMock });
    res = {
      status: statusMock,
    };
    next = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
  });

  it('should return 401 if Cluster-ID header is missing', () => {
    (req.header as jest.Mock).mockReturnValue(undefined);

    clusterMiddleware(req as Request, res as Response, next);

    expect(req.header).toHaveBeenCalledWith('Cluster-ID');
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith('Missing Cluster-ID');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next and log cluster if Cluster-ID header exists', () => {
    const clusterId = 'cluster-123';
    (req.header as jest.Mock).mockReturnValue(clusterId);

    clusterMiddleware(req as Request, res as Response, next);

    expect(req.header).toHaveBeenCalledWith('Cluster-ID');
    expect(consoleLogSpy).toHaveBeenCalledWith('Cluster Middleware: ', clusterId);
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
