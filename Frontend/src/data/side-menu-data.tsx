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

import type { MenuProps } from "antd";
import {
  AppstoreOutlined,
  FundProjectionScreenOutlined,
  PartitionOutlined,
  ContainerOutlined,
  ReadOutlined,
  RadarChartOutlined,
  InfoCircleOutlined,
  BookOutlined,
  SettingOutlined,
  CodeOutlined,
  UsergroupAddOutlined,
  SlidersOutlined,
  AlignLeftOutlined,
} from "@ant-design/icons";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import * as Routes from "@/routes/page-routes";

export type SideMenuItem = Required<MenuProps>["items"][number];

export const getSideMenuData = (router: AppRouterInstance, role: string) => {
  const onMenuClick = (key: string) => {
    router.push(key);
  };

  if(role == "admin"){
    return [
      {
        key: Routes.SIDE_MENU_ROUTES.home,
        icon: <ContainerOutlined />,
        label: "Database Information",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.home);
        },
        disabled: true,
      },
      {
        key: Routes.SIDE_MENU_ROUTES.clusterPage,
        icon: <AppstoreOutlined />,
        label: "Clusters",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.clusterPage);
        },
      },
      {
        key: Routes.SIDE_MENU_ROUTES.graphPanel,
        icon: <RadarChartOutlined />,
        label: "Graph Panel",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.graphPanel);
        },
      },
      {
        key: Routes.SIDE_MENU_ROUTES.queryInterface,
        icon: <FundProjectionScreenOutlined />,
        label: "Query Interface",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.queryInterface);
        },
      },
      {
        key: Routes.SIDE_MENU_ROUTES.performance,
        icon: <SlidersOutlined />,
        label: "Performance",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.performance);
        },
      },
      {
        key: Routes.SIDE_MENU_ROUTES.logs,
        icon: <AlignLeftOutlined />,
        label: "Logs",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.logs);
        },
      },
      {
        key: Routes.SIDE_MENU_ROUTES.queryExecution,
        icon: <PartitionOutlined />,
        label: "Query Execution",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.queryExecution);
        },
        disabled: true,
      },
      {
        key: Routes.SIDE_MENU_ROUTES.querySubmission,
        icon: <BookOutlined />,
        label: "Query Submission",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.querySubmission);
        },
        disabled: true,
      },
      {
        key: Routes.SIDE_MENU_ROUTES.notebook,
        icon: <CodeOutlined />,
        label: "Notebook",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.notebook);
        },
        disabled: true,
      },
      {
        key: Routes.SIDE_MENU_ROUTES.userManagemnt,
        icon: <UsergroupAddOutlined />,
        label: "User Management",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.userManagemnt);
        },
      },
      {
        key: Routes.SIDE_MENU_ROUTES.guides,
        icon: <ReadOutlined />,
        label: "Guides",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.guides);
        },
      },
      {
        key: Routes.SIDE_MENU_ROUTES.settings,
        icon: <SettingOutlined />,
        label: "Settings",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.settings);
        },
        disabled: true,
      },
      {
        key: Routes.SIDE_MENU_ROUTES.about,
        icon: <InfoCircleOutlined />,
        label: "About",
        onClick: () => {
          onMenuClick(Routes.SIDE_MENU_ROUTES.about);
        },
        disabled: true,
      },
    ];
  }

  return [
    {
      key: Routes.SIDE_MENU_ROUTES.home,
      icon: <ContainerOutlined />,
      label: "Database Information",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.home);
      },
      disabled: true,
    },
    {
      key: Routes.SIDE_MENU_ROUTES.clusterPage,
      icon: <AppstoreOutlined />,
      label: "Clusters",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.clusterPage);
      },
    },
    {
      key: Routes.SIDE_MENU_ROUTES.graphPanel,
      icon: <RadarChartOutlined />,
      label: "Graph Panel",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.graphPanel);
      },
    },
    {
      key: Routes.SIDE_MENU_ROUTES.queryInterface,
      icon: <FundProjectionScreenOutlined />,
      label: "Query Interface",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.queryInterface);
      },
    },
    {
      key: Routes.SIDE_MENU_ROUTES.performance,
      icon: <SlidersOutlined />,
      label: "Performance",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.performance);
      },
    },
    {
      key: Routes.SIDE_MENU_ROUTES.logs,
      icon: <AlignLeftOutlined />,
      label: "Logs",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.logs);
      },
    },
    {
      key: Routes.SIDE_MENU_ROUTES.queryExecution,
      icon: <PartitionOutlined />,
      label: "Query Execution",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.queryExecution);
      },
      disabled: true,
    },
    {
      key: Routes.SIDE_MENU_ROUTES.querySubmission,
      icon: <BookOutlined />,
      label: "Query Submission",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.querySubmission);
      },
      disabled: true,
    },
    {
      key: Routes.SIDE_MENU_ROUTES.notebook,
      icon: <CodeOutlined />,
      label: "Notebook",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.notebook);
      },
      disabled: true,
    },
    {
      key: Routes.SIDE_MENU_ROUTES.userManagemnt,
      icon: <UsergroupAddOutlined />,
      label: "User Management",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.userManagemnt);
      },
    },
    {
      key: Routes.SIDE_MENU_ROUTES.guides,
      icon: <ReadOutlined />,
      label: "Guides",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.guides);
      },
    },
    {
      key: Routes.SIDE_MENU_ROUTES.settings,
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.settings);
      },
      disabled: true,
    },
    {
      key: Routes.SIDE_MENU_ROUTES.about,
      icon: <InfoCircleOutlined />,
      label: "About",
      onClick: () => {
        onMenuClick(Routes.SIDE_MENU_ROUTES.about);
      },
      disabled: true,
    },
  ];
};
