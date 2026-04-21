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
);
