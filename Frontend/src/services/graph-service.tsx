/**
Copyright 2024 JasmineGraph Team
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

'use client';
import { IGraphDetails } from "@/types/graph-types";
import {IKnowledgeGraph} from "@/types/graph-types";
import {authApi} from "./axios";
import axios from "axios";
import { ACCESS_TOKEN } from "@/hooks/useAccessToken";

export async function getGraphList(): Promise<{data: IGraphDetails[]}> {
  try {
    const result = await authApi({
      method: "get",
      url: `/backend/graph/list`,
      headers: {
        "Cluster-ID": localStorage.getItem("selectedCluster"),
      },
    }).then((res) => res.data);

    return {
      data: result,
    };
  } catch (err) {
    return Promise.reject();
  }
}

export async function getKGConstructionMetaData(graphId: string): Promise<{data: IKnowledgeGraph[]}> {
    try {
        const result = await authApi({
            method: "get",
            url: `/backend/graph/construct-kg-meta`,
            params: { graphId: graphId },
            headers: {
                "Cluster-ID": localStorage.getItem("selectedCluster"),
            },
        }).then((res) => res.data.data);

        return {
            data: result,
        };
    } catch (err) {
        return Promise.reject();
    }
}
export async function getOnProgressKGConstructionMetaData(): Promise<{data: IKnowledgeGraph[]}> {
    try {
        const result = await authApi({
            method: "get",
            url: `/backend/graph/construct-kg-meta/progress`,

            headers: {
                "Cluster-ID": localStorage.getItem("selectedCluster"),
            },
        }).then((res) => res.data.data);

        return {
            data: result,
        };
    } catch (err) {
        return Promise.reject();
    }
}

export async function constructKG(
    hdfsIp: string | null,
    hdfsPort: string | null,
    hdfsFilePath: string | null,
    llmRunnerString:  string | null ,
    inferenceEngine: string | null,
    model: string | null,
    chunkSize: number | null,
    status: string | null | undefined,
    graphId: string | null | undefined
): Promise<{ status: any; message: any; data: any }> {
    try {
        console.log("selected cluster",localStorage.getItem("selectedCluster"))
        const result = await authApi({
            method: "post",
            url: `/backend/graph/hadoop/construct-kg`,
            headers: {
                "Cluster-ID": localStorage.getItem("selectedCluster"),
            },
            data: {
                hdfsIp,
                hdfsPort,
                hdfsFilePath,
                llmRunnerString,
                inferenceEngine,
                model,
                chunkSize,
                status,
                graphId
            },
        }).then((res) => res);

        return {
            status: result.status,
            message: result.data?.message ?? "Success",
            data: result.data?.data ?? []
        };
    } catch (err: any) {
        // ✅ Axios error handling
        if (axios.isAxiosError(err)) {
            return {
                status: err.response?.status ?? 500,
                message:
                    err.response?.data?.message ??
                    "HDFS validation failed",
                data: null,
            };
        }

        //  Non-Axios error
        return {
            status: 500,
            message: "Unexpected error occurred",
            data: null,
        };
    }
}

export async function stopConstructKG(

    graphId: string,
    status: string | undefined,
): Promise<{ data: IGraphDetails[] }> {
    try {
        const result = await authApi({
            method: "post",
            url: `/backend/graph/hadoop/stop-construct-kg`,
            data: {
                graphId,
                status

            },
        }).then((res) => res.data);

        return result;
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function deleteGraph(id: string) {
  try {
    const result = await authApi({
      method: "delete",
      url: `/backend/graph/${id}`,
    }).then((res) => res.data);
    return {
      data: result,
    };
  } catch (err) {
    return Promise.reject();
  }
}

export type KafkaStreamRequest = {
        isExistingGraph: boolean;
        graphId?: string;
        useDefaultGraphId?: boolean;
        partitionAlgorithm?: string;
        isDirected?: boolean;
        useDefaultKafka: boolean;
        kafkaConfigPath?: string;
        topicName: string;
        kafkaBroker?: string;
        groupId?: string;
        offsetReset?: string;
        numberOfPartitions?: number;
};

export type KafkaTopicListResponse = {
    topics: string[];
};

export type KafkaStartStreamResponse = {
    message: string;
    graphId?: string;
    output?: string;
    [key: string]: unknown;
};

export async function startKafkaStream(
        payload: KafkaStreamRequest
): Promise<{ data: KafkaStartStreamResponse }> {
        try {
                const result = await authApi({
                        method: "post",
                        url: `/backend/graph/kafka/stream`,
                        headers: {
                                "Cluster-ID": localStorage.getItem("selectedCluster"),
                        },
                        data: payload,
                }).then((res) => res.data);

        const normalized: KafkaStartStreamResponse = {
            ...result,
            message: String(result?.message ?? "Kafka streaming started"),
            graphId: result?.graphId === undefined ? undefined : String(result.graphId),
            output: result?.output === undefined ? undefined : String(result.output),
        };

        return { data: normalized };
        } catch (err) {
                return Promise.reject(err);
        }
}

export async function stopKafkaStream(topicName?: string): Promise<{ data: { message: string } }> {
        try {
                console.log("📡 Calling stopKafkaStream API endpoint");
                const result = await authApi({
                        method: "post",
                        url: `/backend/graph/kafka/stream/stop`,
                        headers: {
                                "Cluster-ID": localStorage.getItem("selectedCluster"),
                        },
            data: {
                topicName,
            },
                }).then((res) => res.data);

                console.log("📨 stopKafkaStream response:", result);
                return { data: result };
        } catch (err) {
                console.error("❌ stopKafkaStream error:", err);
                return Promise.reject(err);
        }
}

export async function getGraphClusterProperties(): Promise<{ data: Record<string, unknown> }> {
    try {
        const result = await authApi({
            method: "get",
            url: `/backend/graph/info`,
            headers: {
                "Cluster-ID": localStorage.getItem("selectedCluster"),
            },
        }).then((res) => res.data);

        return {
            data: result,
        };
    } catch (err) {
        return Promise.reject(err);
    }
}

const KAFKA_DEFAULTS_KEY = 'kafkaDefaults';

function getCachedKafkaDefaults(): { broker: string; groupId: string; offsetReset: string } | null {
    try {
        const raw = localStorage.getItem(KAFKA_DEFAULTS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export async function getKafkaStreamingDefaults(): Promise<{ data: Record<string, unknown> }> {
    try {
        const result = await authApi({
            method: "get",
            url: `/backend/graph/info`,
            headers: {
                "Cluster-ID": localStorage.getItem("selectedCluster"),
            },
        }).then((res) => res.data);

        const broker = String((result as any)?.broker ?? '').trim();
        const groupId = String((result as any)?.groupId ?? 'jasminegraph-consumer').trim();
        const offsetReset = String((result as any)?.offsetReset ?? 'earliest').trim();

        const defaults = {
            broker,
            groupId: groupId || 'jasminegraph-consumer',
            offsetReset: offsetReset || 'earliest',
        };

        localStorage.setItem(KAFKA_DEFAULTS_KEY, JSON.stringify(defaults));

        return { data: defaults };
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function getKafkaTopics(): Promise<{ data: KafkaTopicListResponse }> {
    try {
        const result = await authApi({
            method: "get",
            url: `/backend/graph/kafka/topics`,
            headers: {
                "Cluster-ID": localStorage.getItem("selectedCluster"),
            },
        }).then((res) => res.data);

        return {
            data: result,
        };
    } catch (err) {
        return Promise.reject(err);
    }
}

export type KafkaStreamConfigStatus = 'active' | 'paused' | 'terminated';

export async function saveKafkaStreamConfig(config: {
    topicName: string;
    graphId?: string;
    isExistingGraph: boolean;
    useDefaultGraphId?: boolean;
    partitionAlgorithm?: string;
    partitionAlgorithmLabel?: string;
    isDirected?: boolean;
    graphTypeLabel?: string;
    useDefaultKafka: boolean;
    kafkaConfigPath?: string;
    kafkaBroker?: string;
    groupId?: string;
    offsetReset?: string;
}): Promise<{ data: { id: number; stream_status: KafkaStreamConfigStatus } }> {
    const result = await authApi({
        method: 'post',
        url: '/backend/graph/kafka/configs',
        headers: { 'Cluster-ID': localStorage.getItem('selectedCluster') },
        data: config,
    }).then((res) => res.data);
    return { data: result.data };
}

export async function loadKafkaStreamConfigs(): Promise<{ data: any[] }> {
    const result = await authApi({
        method: 'get',
        url: '/backend/graph/kafka/configs',
        headers: { 'Cluster-ID': localStorage.getItem('selectedCluster') },
    }).then((res) => res.data);
    return { data: result.data };
}

export async function updateKafkaStreamConfigStatus(
    id: number,
    status: KafkaStreamConfigStatus,
    graphId?: string,
): Promise<{ data: any }> {
    const result = await authApi({
        method: 'patch',
        url: `/backend/graph/kafka/configs/${id}/status`,
        headers: { 'Cluster-ID': localStorage.getItem('selectedCluster') },
        data: { status, graphId },
    }).then((res) => res.data);
    return { data: result.data };
}
