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

import React, { useEffect, useState } from "react";
import { Layout, Menu, theme } from "antd";
import { getSideMenuData } from "@/data/side-menu-data";
import { usePathname, useRouter } from "next/navigation";
import * as Routes from "@/routes/page-routes";
import { useAppSelector } from "@/redux/hook";

const { Sider } = Layout;

const SideMenu = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const pathname = usePathname();
  const { userData } = useAppSelector((state) => state.authData);
  const sideMenuData = getSideMenuData(useRouter(), userData.role);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const path = (pathname || "").split("/")[1] || "";
    // Auto-collapse the menu when viewing the performance or logs page to avoid two sidebars
    if (path === "performance" || path === "logs") setCollapsed(true);
    else setCollapsed(false);
  }, [pathname]);

  const findActiveMenu = () => {
    const path = (pathname || "").split("/")[1] || "";
    return sideMenuData
      .filter((item) => item?.key === `/${path}`)
      .map((item) => item.key)[0];
  };

  return (
    <Sider
      width={200}
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      collapsedWidth={48}
      style={{ background: colorBgContainer }}
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={[Routes.SIDE_MENU_ROUTES.home]}
        selectedKeys={[findActiveMenu()]}
        style={{ height: "100%", borderRight: 0 }}
        items={sideMenuData}
      />
    </Sider>
  );
};

export default SideMenu;
