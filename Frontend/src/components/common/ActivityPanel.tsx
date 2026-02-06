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

"use client";

import React from "react";
import { Alert, List, Typography, Empty, Button, Badge, Space, Modal } from "antd";
import { BugOutlined, CloseCircleFilled } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/redux/hook";
import {
  toggle_activity_panel,
  clear_all_errors,
  clear_errors_by_menu_item,
  remove_error,
} from "@/redux/features/activityData";
import styles from "./ActivityPanel.module.css";

const { Text } = Typography;

interface ActivityPanelProps {
  featureName?: string;
}

export default function ActivityPanel({ featureName }: ActivityPanelProps) {
  const dispatch = useAppDispatch();
  const { errors, isPanelOpen } = useAppSelector((state) => state.activityData);

  const filteredErrors = featureName
    ? errors.filter((error) => error.menuItem === featureName)
    : errors;

  const hasErrors = filteredErrors.length > 0;

  const handleTogglePanel = () => {
    dispatch(toggle_activity_panel());
  };

  const handleRemoveError = (errorId: string) => {
    dispatch(remove_error(errorId));
  };

  const handleClearAll = () => {
    Modal.confirm({
      title: "Confirm Deletion",
      content: featureName
        ? `This will permanently delete all activities for "${featureName}" (system activities included). This action is irreversible. Proceed?`
        : "This will permanently delete ALL activities (including system-level). This action is irreversible. Proceed?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        if (featureName) {
          dispatch(clear_errors_by_menu_item(featureName));
        } else {
          dispatch(clear_all_errors());
        }
      },
    });
  };

  return (
    <>
      {/* Toggle button fixed to bottom-left inside the white content box */}
      <div className={styles.toggleButtonContainer}>
        <Space>
          <Button
            type={hasErrors ? "primary" : "default"}
            shape="round"
            size="small"
            icon={<BugOutlined />}
            onClick={handleTogglePanel}
            className={styles.toggleButton}
          >
            Activity Panel
            {hasErrors && (
              <Badge
                count={filteredErrors.length}
                style={{ backgroundColor: "#ff4d4f", marginLeft: 8 }}
              />
            )}
          </Button>
        </Space>
      </div>

      {/* Dim the underlying content when the panel is open */}
      {isPanelOpen && (
        <div className={styles.overlay} />
      )}

      {/* Right-side overlay panel spanning the white content height */}
      {isPanelOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <BugOutlined style={{ color: "#ff4d4f" }} />
              <Text strong>
                Activity Panel{featureName ? ` – ${featureName}` : " (All)"}
              </Text>
              {hasErrors && (
                <Badge
                  count={filteredErrors.length}
                  style={{ backgroundColor: "#ff4d4f" }}
                />
              )}
            </div>
            <div className={styles.headerRight}>
              {hasErrors && (
                <Button
                  type="text"
                  size="small"
                  danger
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              )}
              <Button type="text" size="small" onClick={handleTogglePanel}>
                Close
              </Button>
            </div>
          </div>

          {!hasErrors ? (
            <Empty description="No activity for this section" />
          ) : (
            <List
              size="small"
              dataSource={filteredErrors}
              className={styles.errorList}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  className={styles.errorItem}
                >
                  <Alert
                    type="error"
                    showIcon
                    icon={
                      <CloseCircleFilled
                        style={{ color: "#ff4d4f", cursor: "pointer" }}
                        onClick={() => handleRemoveError(item.id)}
                      />
                    }
                    message={
                      <div className={styles.errorHeader}>
                        <div className={styles.errorTitleContainer}>
                          <Text strong>{item.title}</Text>
                          {!featureName && (
                            <div className={styles.errorMenuItem}>
                              <Text type="secondary">
                                {item.menuItem}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                    description={
                      <div className={styles.errorDescription}>
                        <div className={styles.errorMessage}>{item.message}</div>
                        <div className={styles.errorTimeContainer}>
                          <Text type="secondary" className={styles.errorTime}>
                            {item.time}
                          </Text>
                        </div>
                      </div>
                    }
                    className={styles.errorAlert}
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      )}
    </>
  );
}
