/**
 Copyright 2025 JasmineGraph Team
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

import { pool } from '../databaseConnection';

export type KGStatus =
    | 'pending'
    | 'running'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'stopped';

export interface LLMRunner {
    runner: string;
    chunks: number;
}

export interface KGConstructionMeta {
    id: number;
    graph_id: string;
    hdfs_ip: string;
    hdfs_port: number;
    hdfs_file_path: string;
    llm_runner_string: LLMRunner[];
    inference_engine: string;
    model: string;
    chunk_size: number;
    status: KGStatus;
    user_id: string;
    message?: string;
    cluster_id: string;
    created_at: string;
    updated_at: string;
}

//Create new KG Construction metadata
export async function createKGConstructionMetaRepo(
    meta: Omit<KGConstructionMeta, 'id' | 'created_at' | 'updated_at'>
): Promise<KGConstructionMeta> {
    const result = await pool.query(
        `INSERT INTO kg_construction_meta (
            graph_id, hdfs_ip, hdfs_port, hdfs_file_path,
            llm_runner_string, inference_engine, model,
            chunk_size, status, user_id, message, cluster_id
        )
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
        [
            meta.graph_id,
            meta.hdfs_ip,
            meta.hdfs_port,
            meta.hdfs_file_path,
            JSON.stringify(meta.llm_runner_string),
            meta.inference_engine,
            meta.model,
            meta.chunk_size,
            meta.status,
            meta.user_id,
            meta.message || '',
            meta.cluster_id,
        ]
    );
    return result.rows[0];
}

//Get all KGConstructionMeta entries
export async function getAllKGConstructionMetaRepo(): Promise<KGConstructionMeta[]> {
    const result = await pool.query(
        `SELECT * FROM kg_construction_meta ORDER BY created_at DESC`
    );
    return result.rows;
}

//Get by ID
export async function getKGConstructionMetaByIdRepo(
    id: number
): Promise<KGConstructionMeta | null> {
    const result = await pool.query(
        `SELECT * FROM kg_construction_meta WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

//Get KG Construction metadata by cluster ID
export async function getKGConstructionMetaByClusterRepo(
    clusterId: number
): Promise<KGConstructionMeta[]> {
    console.log(clusterId)
    const result = await pool.query(
        `SELECT * FROM kg_construction_meta WHERE cluster_id = $1 ORDER BY created_at DESC`,
        [clusterId]
    );
    return result.rows;
}

//Update status or message
export async function updateKGConstructionMetaStatusRepo(
    id: number,
    status: KGStatus,
    message?: string
): Promise<KGConstructionMeta | null> {
    const result = await pool.query(
        `UPDATE kg_construction_meta
         SET status = $2, message = COALESCE($3, message), updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
             RETURNING *`,
        [id, status, message || null]
    );
    return result.rows[0] || null;
}

//Delete meta by ID
export async function deleteKGConstructionMetaRepo(id: number): Promise<null> {
    const result = await pool.query(
        `DELETE FROM kg_construction_meta WHERE id = $1`,
        [id]
    );
    if (result.rowCount === 0) {
        return null;
    }
    return result.rows[0];
}
