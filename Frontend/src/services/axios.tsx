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
import axios from "axios";
import type { AxiosError } from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/hooks/useAccessToken";
import { SELECTED_CLUSTER } from "@/hooks/useCluster";

const getAccessToken = () => {
    if (typeof window === "undefined") {
        return null;
    }
    return localStorage.getItem(ACCESS_TOKEN);
}

const getClusterID = () => {
    if (typeof window === "undefined") {
        return null;
    }
    return localStorage.getItem(SELECTED_CLUSTER);
}   

export const authApi = axios.create({
  headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": "Bearer " + getAccessToken(),
      "Cluster-ID": getClusterID(),
  }
})

const api = axios.create({
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const tokenStr = sessionStorage.getItem("AUTH");
        try {
            if (tokenStr) {
                const token = JSON.parse(tokenStr);
                if (token) {
                    config.headers[
                        "Authorization"
                    ] = `Bearer ${token?.access_token}`;
                }
            }
        } catch (e) {
            console.log(e);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// prevent concurrent refresh calls by sharing a single refresh promise
let refreshTokenPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError & { config?: any }) => {
    const originalRequest = error.config as any;

    // Skip interceptor for refresh token requests
    if (originalRequest._isRefreshRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN) : null;
        if (!refreshToken) {
          console.log("[AXIOS] No refresh token available, redirecting to login");
          if (typeof window !== "undefined") {
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            window.location.href = "/auth";
          }
          return Promise.reject(error);
        }

        if (!refreshTokenPromise) {
          refreshTokenPromise = axios
            .post("/backend/auth/refresh-token", { token: refreshToken })
            .then((res) => {
              const { accessToken, refreshToken: newRefreshToken } = res.data;
              if (typeof window !== "undefined") {
                localStorage.setItem(ACCESS_TOKEN, accessToken);
                localStorage.setItem(REFRESH_TOKEN, newRefreshToken);
              }
              return accessToken as string;
            })
            .catch((e) => {
              if (typeof window !== "undefined") {
                localStorage.removeItem(ACCESS_TOKEN);
                localStorage.removeItem(REFRESH_TOKEN);
              }
              throw e;
            })
            .finally(() => {
              // allow future refresh attempts after this completes
              refreshTokenPromise = null;
            });
        }

        const newAccessToken = await refreshTokenPromise;
        if (!newAccessToken) return Promise.reject(error);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // retry original request using raw axios to avoid interceptor recursion
        return axios(originalRequest);
      } catch (refreshError) {
        console.error("[AXIOS] Token refresh failed:", refreshError);
        if (typeof window !== "undefined") {
          window.location.href = "/auth";
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          console.error("[AXIOS] Bad Request:", data);
          break;
        case 500:
          console.error("[AXIOS] Internal Server Error. Please try again later.");
          break;
        default:
          console.error("[AXIOS] An error occurred:", status, data);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
