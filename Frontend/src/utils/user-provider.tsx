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
import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Spin, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useAppSelector } from "@/redux/hook";
import { getUserDataByToken } from "@/services/auth-service";
import { set_User_Data } from "@/redux/features/authData";
import useAccessToken from "@/hooks/useAccessToken";
import { IUserAccessData } from "@/types/user-types";

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathName = usePathname();
  const dispatch = useDispatch();
  const { getSrvAccessToken, isTokenExpired, refreshAccessToken } = useAccessToken();
  const { isUserDataFetched } = useAppSelector((state) => state.authData);
  const [isLoading, setIsLoading] = useState(true);

  const getUser = async () => {
    try {
      setIsLoading(true);
      let token = getSrvAccessToken();

      if (!token) {
        console.log(
          "[USER_PROVIDER] No access token found, redirecting to login"
        );
        router.replace("/auth");
        return;
      }
      if (isTokenExpired(token)) {
        try {
          token = await refreshAccessToken();
          console.log("[USER_PROVIDER] Token refreshed successfully");
          
          if (!token) {
            throw new Error("Token refresh returned null");
          }
        } catch (refreshError) {
          console.log(
            "[USER_PROVIDER] Token refresh failed, redirecting to login"
          );
          router.replace("/auth");
          return;
        }
      }
      const res = await getUserDataByToken(token).then((res) => res.data);
      const userData: IUserAccessData = {
        email: res.data.email,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        role: res.data.role,
        enabled: res.data.enabled,
        id: res.data.id,
      }
      dispatch(set_User_Data(userData));
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      router.replace("/auth");
      message.error("An error occurred while fetching user data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(pathName == "/auth" || pathName == "/setup") return setIsLoading(false);
    if(isUserDataFetched){
      setIsLoading(false);
      return
    }
    const reqToken = getSrvAccessToken();
    if (!isUserDataFetched && reqToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${reqToken}`;
      getUser();
      return;
    }
    if (!reqToken) {
      router.replace("/auth");
      return;
    }
    setIsLoading(false);
  }, [pathName]);

  return isLoading ? (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <Spin indicator={<LoadingOutlined style={{ fontSize: 70 }} spin />} />
    </div>
  ) : (
    children
  );
};

export default UserProvider;
