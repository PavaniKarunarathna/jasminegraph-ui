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

"use client";

import React from "react";
import PageWrapper from "@/layouts/page-wrapper";
import { GRAFANA_DASHBOARD } from "@/properties";
import styles from "./performance.module.css";
import { useIframeAvailability } from "@/hooks/useIframeAvailability";

export default function PerformancePage() {
  const dashboardUrl = `${GRAFANA_DASHBOARD.baseUrl}/d/${GRAFANA_DASHBOARD.uid}/${GRAFANA_DASHBOARD.slug}`;
  const [iframeError, handleIframeError, handleIframeLoad] = useIframeAvailability();

  return (
    <PageWrapper>
      <div className={styles.iframeContainer}>
        {iframeError === "none" ? (
          <iframe
            src={dashboardUrl}
            className={styles.iframe}
            title="Grafana Dashboard"
            style={{ border: "none", width: "100%", height: "100%" }}
            onError={handleIframeError}
            onLoad={handleIframeLoad}
          />
        ) : iframeError === "service" ? (
          <div className={styles.container}>
            <p>
              Performance dashboard is currently unavailable. Please check if the Grafana service is running.
            </p>
          </div>
        ) : (
          <div className={styles.container}>
            <div>
              Unable to display performance dashboard in this page. This may be due to browser security settings or the service blocking embedding.
            </div>
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.openInNewTabBtn}
            >
              Open Performance Dashboard in New Tab
            </a>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
