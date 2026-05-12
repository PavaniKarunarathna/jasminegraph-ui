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

import { pool } from '../databaseConnection';

const ensureKafkaStreamConfigTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS kafka_stream_config (
            id SERIAL PRIMARY KEY,
            topic_name VARCHAR(255) NOT NULL,
            graph_id VARCHAR(255),
            is_existing_graph BOOLEAN NOT NULL DEFAULT false,
            use_default_graph_id BOOLEAN,
            partition_algorithm VARCHAR(50),
            partition_algorithm_label VARCHAR(255),
            is_directed BOOLEAN,
            graph_type_label VARCHAR(255),
            use_default_kafka BOOLEAN NOT NULL DEFAULT true,
            kafka_config_path TEXT,
            kafka_broker VARCHAR(255),
            group_id VARCHAR(255),
            offset_reset VARCHAR(50),
            stream_status VARCHAR(20) CHECK (stream_status IN ('active', 'paused', 'terminated')) NOT NULL DEFAULT 'active',
            cluster_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

export type KafkaStreamConfigStatus = 'active' | 'paused' | 'terminated';

export interface KafkaStreamConfig {
    id: number;
    topic_name: string;
    graph_id?: string;
    is_existing_graph: boolean;
    use_default_graph_id?: boolean;
    partition_algorithm?: string;
    partition_algorithm_label?: string;
    is_directed?: boolean;
    graph_type_label?: string;
    use_default_kafka: boolean;
    kafka_config_path?: string;
    kafka_broker?: string;
    group_id?: string;
    offset_reset?: string;
    stream_status: KafkaStreamConfigStatus;
    cluster_id: string;
    created_at: string;
    updated_at: string;
}

export async function createKafkaStreamConfigRepo(
    config: Omit<KafkaStreamConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<KafkaStreamConfig> {
    await ensureKafkaStreamConfigTable();
    const result = await pool.query(
        `INSERT INTO kafka_stream_config (
            topic_name, graph_id, is_existing_graph, use_default_graph_id,
            partition_algorithm, partition_algorithm_label, is_directed, graph_type_label,
            use_default_kafka, kafka_config_path, kafka_broker, group_id,
            offset_reset, stream_status, cluster_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING *`,
        [
            config.topic_name,
            config.graph_id ?? null,
            config.is_existing_graph,
            config.use_default_graph_id ?? null,
            config.partition_algorithm ?? null,
            config.partition_algorithm_label ?? null,
            config.is_directed ?? null,
            config.graph_type_label ?? null,
            config.use_default_kafka,
            config.kafka_config_path ?? null,
            config.kafka_broker ?? null,
            config.group_id ?? null,
            config.offset_reset ?? null,
            config.stream_status,
            config.cluster_id,
        ]
    );
    return result.rows[0];
}

export async function getKafkaStreamConfigsByClusterRepo(
    clusterId: string
): Promise<KafkaStreamConfig[]> {
    await ensureKafkaStreamConfigTable();
    const result = await pool.query(
        `SELECT * FROM kafka_stream_config WHERE cluster_id = $1 ORDER BY created_at DESC`,
        [clusterId]
    );
    return result.rows;
}

export async function updateKafkaStreamConfigStatusRepo(
    id: number,
    status: KafkaStreamConfigStatus,
    graphId?: string
): Promise<KafkaStreamConfig | null> {
    await ensureKafkaStreamConfigTable();
    const result = await pool.query(
        `UPDATE kafka_stream_config
         SET stream_status = $2,
             graph_id = COALESCE($3, graph_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, status, graphId ?? null]
    );
    return result.rows[0] || null;
}
