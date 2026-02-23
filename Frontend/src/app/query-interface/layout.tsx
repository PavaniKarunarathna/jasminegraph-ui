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
import React, { useState } from "react";
import PageWrapper from "@/layouts/page-wrapper";
import { Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import { QueryInterfaceMenu } from "@/data/menu-data";
import * as Routes from "@/routes/page-routes";
import { useRouter } from "next/navigation";
import ActivityPanel from "@/components/common/ActivityPanel";

const { Content } = Layout;
export default function GraphPanelLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>) {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [current, setCurrent] = useState(Routes.QUERY_PANEL_ROUTES.query);
  const router = useRouter();

  const onClick: MenuProps["onClick"] = (e) => {
    setCurrent(e.key);
    router.push(Routes.SIDE_MENU_ROUTES.queryInterface + e.key);
  };

  return (
    <PageWrapper>
      <Layout style={{ padding: "24px 24px", height: "92vh" }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Menu
            onClick={onClick}
            selectedKeys={[current]}
            mode="horizontal"
            items={QueryInterfaceMenu}
          />
          {children}
          <ActivityPanel featureName="Query Interface" />
        </Content>
      </Layout>
    </PageWrapper>
  );
}
