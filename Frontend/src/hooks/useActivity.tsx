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

import { useCallback } from "react";
import { useAppDispatch } from "@/redux/hook";
import { add_error } from "@/redux/features/activityData";

interface ReportErrorOptions {
  menuItem: string;
  title: string;
  message: string;
}

export const useActivity = () => {
  const dispatch = useAppDispatch();

  const reportError = useCallback(
    (options: ReportErrorOptions) => {
      dispatch(
        add_error({
          menuItem: options.menuItem,
          title: options.title,
          message: options.message,
        })
      );
    },
    [dispatch]
  );

  const reportErrorFromException = useCallback(
    (menuItem: string, error: any, customTitle?: string) => {
      const title = customTitle || "An error occurred";
      let message = "Unknown error";

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }

      dispatch(
        add_error({
          menuItem,
          title,
          message,
        })
      );
    },
    [dispatch]
  );

  return {
    reportError,
    reportErrorFromException,
  };
};
