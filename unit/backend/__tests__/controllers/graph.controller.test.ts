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

import { Request, Response } from 'express';
import {
  getClusterDetails,
  getGraphVisualization,
  getDataFromHadoop,
  validateHDFS,
  getKGConstructionMetaByGraphId,
  getOnProgressKGConstructionMeta,
  updateKGConstructionMetaByClusterId,
} from '../../../../Backend/src/controllers/graph.controller';

import { ErrorCode, ErrorMsg } from '../../../../Backend/src/constants/error.constants';
import { HTTP } from '../../../../Backend/src/constants/constants';

import * as clusterRepository from '../../../../Backend/src/repository/cluster.repository';
import * as kgRepository from '../../../../Backend/src/repository/kg-construction-meta.repository';

import { validClusterData } from '../../fixtures/cluster';
import { runningKGMeta } from '../../fixtures/kg';

jest.mock('../../../../Backend/src/repository/cluster.repository');
jest.mock('../../../../Backend/src/repository/kg-construction-meta.repository');
jest.mock('../../../../Backend/src/utils/graph', () => ({
  parseGraphFile: jest.fn(),
}));

describe('Graph Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    sendMock = jest.fn();

    req = {
      header: jest.fn(),
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    };

    jest.clearAllMocks();
  });

  describe('getClusterDetails', () => {
    it('returns host and port for valid cluster', async () => {
      (req.header as jest.Mock).mockReturnValue('1');
      jest.spyOn(clusterRepository, 'getClusterByIdRepo').mockResolvedValue(validClusterData as any);

      const result = await getClusterDetails(req as Request);

      expect(result).toEqual({
        host: validClusterData.host,
        port: validClusterData.port,
      });
    });

    it('returns ClusterNotFound error', async () => {
      (req.header as jest.Mock).mockReturnValue('1');
      jest.spyOn(clusterRepository, 'getClusterByIdRepo').mockResolvedValue(null);

      const result = await getClusterDetails(req as Request);

      expect(result).toEqual({
        code: ErrorCode.ClusterNotFound,
        message: ErrorMsg.ClusterNotFound,
        errorDetails: '',
      });
    });
  });

  describe('getKGConstructionMetaByGraphId', () => {
    it('returns metadata for graphId', async () => {
      req.query = { graphId: 'graph-123' };
      (req.header as jest.Mock).mockReturnValue('1');

      jest
        .spyOn(kgRepository, 'getKGConstructionMetaByClusterRepo')
        .mockResolvedValue([runningKGMeta] as any);

      await getKGConstructionMetaByGraphId(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: [runningKGMeta] });
    });

    it('returns 404 if metadata not found', async () => {
      req.query = { graphId: 'graph-123' };
      (req.header as jest.Mock).mockReturnValue('1');

      jest
        .spyOn(kgRepository, 'getKGConstructionMetaByClusterRepo')
        .mockResolvedValue([]);

      await getKGConstructionMetaByGraphId(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('getOnProgressKGConstructionMeta', () => {
    it('returns running KG metadata', async () => {
      (req.header as jest.Mock).mockReturnValue('1');

      jest
        .spyOn(kgRepository, 'getKGConstructionMetaByClusterRepo')
        .mockResolvedValue([runningKGMeta] as any);

      await getOnProgressKGConstructionMeta(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('updateKGConstructionMetaByClusterId', () => {
    it('updates KG metadata status', async () => {
      req.params = { clusterId: '1', hdfsFilePath: '/data/file' };
      req.body = { status: 'paused', message: 'Paused' };

      jest
        .spyOn(kgRepository, 'getKGConstructionMetaByClusterRepo')
        .mockResolvedValue([runningKGMeta] as any);

      jest
        .spyOn(kgRepository, 'updateKGConstructionMetaStatusRepo')
        .mockResolvedValue({ ...runningKGMeta, status: 'paused' } as any);

      await updateKGConstructionMetaByClusterId(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('returns 404 if metadata not found', async () => {
      req.params = { clusterId: '1', hdfsFilePath: '/invalid' };

      jest
        .spyOn(kgRepository, 'getKGConstructionMetaByClusterRepo')
        .mockResolvedValue([]);

      await updateKGConstructionMetaByClusterId(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('getDataFromHadoop', () => {
    it('returns 400 if ip or port missing', async () => {
      req.query = {};

      await getDataFromHadoop(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('validateHDFS', () => {
    it('returns 400 if required fields missing', async () => {
      req.body = {};

      await validateHDFS(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('getGraphVisualization', () => {
    it('returns parsed graph data', async () => {
      const { parseGraphFile } = require('../../../../Backend/src/utils/graph');
      parseGraphFile.mockReturnValue({ nodes: [], edges: [] });

      req.query = { id: '1' };

      await getGraphVisualization(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(HTTP[200]);
      expect(sendMock).toHaveBeenCalled();
    });
  });
});
