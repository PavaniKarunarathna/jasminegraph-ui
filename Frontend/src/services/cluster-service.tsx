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
import { AxiosResponse } from "axios";
import {authApi} from "./axios";
import { IClusterProperties } from "@/types/cluster-types"
interface ApiResponse<T> {
  data: T;
}

interface ApiErrorResponse {
  errorCode: string;
  message: string;
}

export async function addNewCluster(name: string, description: string, host: string, port: string, token: string): Promise<ApiResponse<string> | ApiErrorResponse> {
  try {
    const result: AxiosResponse<any> = await authApi({
      method: "post",
      url: "/backend/clusters",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      data: {
        name,
        description,
        host,
        port,
      },
    });

    return {
      data: result.data,
    };
  } catch (err: any) {
    if (err.response) {
      const errorCode = err.response.data.errorCode;
      const errorMessage = err.response.data.message;
      return { errorCode: errorCode, message: errorMessage };
    } else {
      return Promise.reject(err);
    }
  }
}

export async function getAllClusters(token: string | null) {
  if (!token) {
    return Promise.reject(new Error("Authentication token is required"));
  }
  try {
    const result = await authApi({
      method: "get",
      url: `/backend/clusters/myClusters`,
      headers: {
      Authorization: `Bearer ${token}`,
    },
    }).then((res) => res.data);
    return {
      data: result.data,
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getCluster(clusterID: string, token: string) {
  try {
    const result = await authApi({
      method: "get",
      url: `/backend/clusters/${clusterID}`,
       headers: {
        "Authorization": `Bearer ${token}`,
      },
    }).then((res) => res.data);
    return {
      data: result.data,
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getClustersStatusByIds(token: string | null, ids: number[]) {
  if (!token) {
    return Promise.reject(new Error("Authentication token is required"));
  }
  try {
    const result = await authApi({
      method: "post",
      url: `/backend/clusters/status`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { ids },
    }).then(res => res.data);
    return result;
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function addUserToCluster(userID: string, clusterID: string, token: string){
  try {
    const result = await authApi({
      method: "post",
      url: `/backend/clusters/addUser`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        userID, 
        clusterID,
      },
    }).then((res) => res.data);
    return {
      data: result.data,
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function removeUserFromCluster(userID: string, clusterID: string, token: string){
  try {
    const result = await authApi({
      method: "post",
      url: `/backend/clusters/removeUser`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        userID, 
        clusterID,
      },
    }).then((res) => res.data);
    return {
      data: result.data,
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getClusterProperties(param: string): Promise<{data: IClusterProperties}> {
  try {
    const result = await authApi({
      method: "get",
      url: `/backend/graph/info`,
      headers: {
        "Cluster-ID": param,
      },
    }).then((res) => res.data);

    return {
      data: result,
    };
  } catch (err) {
    return Promise.reject();
  }
}
