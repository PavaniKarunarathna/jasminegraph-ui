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
