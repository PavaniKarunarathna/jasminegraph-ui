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

import React, { useEffect, useState } from "react";
import PageWrapper from "@/layouts/page-wrapper";
import { GRAFANA_DASHBOARD } from "@/properties";
import styles from "./performance.module.css";

export default function PerformancePage() {
  const dashboardUrl = `${GRAFANA_DASHBOARD.baseUrl}/d/${GRAFANA_DASHBOARD.uid}/${GRAFANA_DASHBOARD.slug}`;
  const [isAvailable, setIsAvailable] = useState<boolean | null>(true);

  useEffect(() => {
    const checkDashboardAvailability = async () => {
      try {
        const response = await fetch(dashboardUrl, { method: "HEAD" });
        if (response.ok) {
          setIsAvailable(true);
        } else {
          setIsAvailable(false);
        }
      } catch (error) {
        // If fetch fails (likely CORS), fall back to iframe
        console.warn("Fetch failed, possibly due to CORS:", error);
        setIsAvailable(true); // We assume dashboard exists
      }
    };
  }, [dashboardUrl]);

  if (isAvailable === null) {
    return (
      <PageWrapper>
        <div className={styles.container}>
          <p>Checking performance dashboard&apos;s availability</p>
        </div>
      </PageWrapper>
    );
  }

  if (isAvailable === false) {
    return (
      <PageWrapper>
        <div className={styles.container}>
          <p>
            Performance dashboard is currently unavailable. Please check if the
            Grafana service is running.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className={styles.iframeContainer}>
        <iframe
          src={dashboardUrl}
          className={styles.iframe}
          title="Grafana Dashboard"
        />
      </div>
    </PageWrapper>
  );
}
