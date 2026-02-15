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

"use client";

import axios from "axios";
import { JWT_SEGMENT_COUNT } from "@/properties";

export const ACCESS_TOKEN = "auth.srv.token";
export const REFRESH_TOKEN = "auth.srv.refresh.token";

const useAccessToken = () => {
  const getSrvAccessToken = () => {
    return localStorage.getItem(ACCESS_TOKEN);
  };

  const setSrvAccessToken = (accessToken: string) => {
    if (typeof window === "undefined") return null;
    localStorage.setItem(ACCESS_TOKEN, accessToken);
  };

  const getSrvRefreshToken = () => {
    return localStorage.getItem(REFRESH_TOKEN);
  };

  const setSrvRefreshToken = (refreshToken: string) => {
    if (typeof window === "undefined") return null;
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
  };

  const clearTokens = () => {
    if (typeof window === "undefined") return null;
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
  };

  const isTokenExpired = (token: string | null) => {
    if (!token || token.split('.').length !== JWT_SEGMENT_COUNT) 
      return true;
    try {
      const parts = token.split(".");
      // Validate base64 format before decoding
      if (!/^[A-Za-z0-9_-]*$/.test(parts[1])) {
        throw new Error("Invalid base64 in payload");
      }
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp < currentTime;
      console.log(`[TOKEN] Token expired: ${isExpired}`);
      return isExpired;
    } catch (error) {
      console.error("[TOKEN] Error parsing token:", error);
      return true;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = getSrvRefreshToken();
      if (!refreshToken) {
        console.log("[TOKEN] No refresh token available for refresh");
        throw new Error("No refresh token available for refresh");
      }
      const response = await axios.post("/backend/auth/refresh-token", {
        token: refreshToken,
      }, { _isRefreshRequest: true } as any);
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      setSrvAccessToken(accessToken);
      setSrvRefreshToken(newRefreshToken);

      console.log("[TOKEN] Successfully refreshed access token");
      return accessToken;
    } catch (error) {
      console.error("[TOKEN] Failed to refresh access token:", error);
      clearTokens();
      throw error;
    }
  };

  return {
    getSrvAccessToken,
    setSrvAccessToken,
    getSrvRefreshToken,
    setSrvRefreshToken,
    clearTokens,
    isTokenExpired,
    refreshAccessToken,
  };
};

export default useAccessToken;
