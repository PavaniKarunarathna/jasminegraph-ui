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

import { useState, useRef, useEffect, useCallback } from "react";

export type IframeErrorState = "none" | "service" | "embed";

export function useIframeAvailability(timeoutMs: number = 6000): [
  IframeErrorState,
  () => void,
  () => void
] {
  const [iframeError, setIframeError] = useState<IframeErrorState>("none");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (iframeError === "none") {
        setIframeError("service");
      }
    }, timeoutMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [iframeError, timeoutMs]);

  const handleIframeError = useCallback(() => {
    setIframeError("embed");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleIframeLoad = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return [iframeError, handleIframeError, handleIframeLoad];
}
