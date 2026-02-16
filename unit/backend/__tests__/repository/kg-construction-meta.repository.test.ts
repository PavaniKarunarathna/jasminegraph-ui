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

import { pool } from '../../../../Backend/src/databaseConnection';
import {
  createKGConstructionMetaRepo,
  getAllKGConstructionMetaRepo,
  getKGConstructionMetaByIdRepo,
  getKGConstructionMetaByClusterRepo,
  updateKGConstructionMetaStatusRepo,
  deleteKGConstructionMetaRepo,
  KGStatus,
  KGConstructionMeta,
  LLMRunner,
} from '../../../../Backend/src/repository/kg-construction-meta.repository';

jest.mock('../../../../Backend/src/databaseConnection', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const mockLLMRunners: LLMRunner[] = [
  { runner: 'runner1', chunks: 3 },
  { runner: 'runner2', chunks: 5 },
];

const baseMeta: Omit<KGConstructionMeta, 'id' | 'created_at' | 'updated_at'> = {
  graph_id: 'graph-123',
  hdfs_ip: '127.0.0.1',
  hdfs_port: 9000,
  hdfs_file_path: '/data/file.txt',
  llm_runner_string: mockLLMRunners,
  inference_engine: 'engine-x',
  model: 'model-y',
  chunk_size: 10,
  status: 'pending',
  user_id: 'user-abc',
  message: '',
  cluster_id: 'cluster-1',
};

const mockMeta: KGConstructionMeta = {
  id: 1,
  ...baseMeta,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('KG Construction Meta Repo', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createKGConstructionMetaRepo', () => {
    it('inserts new meta and returns it', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockMeta] });

      const result = await createKGConstructionMetaRepo(baseMeta);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO kg_construction_meta'),
        expect.arrayContaining([
          baseMeta.graph_id,
          baseMeta.hdfs_ip,
          baseMeta.hdfs_port,
          baseMeta.hdfs_file_path,
          JSON.stringify(baseMeta.llm_runner_string),
          baseMeta.inference_engine,
          baseMeta.model,
          baseMeta.chunk_size,
          baseMeta.status,
          baseMeta.user_id,
          '',
          baseMeta.cluster_id,
        ])
      );

      expect(result).toEqual(mockMeta);
    });
  });

  describe('getAllKGConstructionMetaRepo', () => {
    it('returns all meta entries ordered by created_at DESC', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockMeta] });

      const result = await getAllKGConstructionMetaRepo();

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM kg_construction_meta ORDER BY created_at DESC');
      expect(result).toEqual([mockMeta]);
    });
  });

  describe('getKGConstructionMetaByIdRepo', () => {
    it('returns meta by ID if found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockMeta] });

      const result = await getKGConstructionMetaByIdRepo(mockMeta.id);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM kg_construction_meta WHERE id = $1', [mockMeta.id]);
      expect(result).toEqual(mockMeta);
    });

    it('returns null if not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await getKGConstructionMetaByIdRepo(999);

      expect(result).toBeNull();
    });
  });

  describe('getKGConstructionMetaByClusterRepo', () => {
    it('returns meta by cluster ID ordered by created_at DESC', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockMeta] });

      const result = await getKGConstructionMetaByClusterRepo(parseInt(mockMeta.cluster_id));

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM kg_construction_meta WHERE cluster_id = $1 ORDER BY created_at DESC',
        [parseInt(mockMeta.cluster_id)]
      );

      expect(result).toEqual([mockMeta]);
    });
  });

  describe('updateKGConstructionMetaStatusRepo', () => {
    it('updates status and message and returns updated meta', async () => {
      const updatedMeta = { ...mockMeta, status: 'running' as KGStatus, message: 'Started' };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [updatedMeta] });

      const result = await updateKGConstructionMetaStatusRepo(mockMeta.id, 'running', 'Started');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE kg_construction_meta'),
        [mockMeta.id, 'running', 'Started']
      );

      expect(result).toEqual(updatedMeta);
    });

    it('returns null if no rows updated', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await updateKGConstructionMetaStatusRepo(999, 'failed', 'Error');

      expect(result).toBeNull();
    });
  });

  describe('deleteKGConstructionMetaRepo', () => {
    it('deletes meta and returns null if rowCount is zero', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0, rows: [] });

      const result = await deleteKGConstructionMetaRepo(999);

      expect(pool.query).toHaveBeenCalledWith('DELETE FROM kg_construction_meta WHERE id = $1', [999]);
      expect(result).toBeNull();
    });
  });
});
