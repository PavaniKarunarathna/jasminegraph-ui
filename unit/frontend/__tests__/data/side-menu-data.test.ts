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

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

jest.mock(
  "@ant-design/icons",
  () => {
    const icon = () => null;
    return {
      AppstoreOutlined: icon,
      FundProjectionScreenOutlined: icon,
      PartitionOutlined: icon,
      ContainerOutlined: icon,
      ReadOutlined: icon,
      RadarChartOutlined: icon,
      InfoCircleOutlined: icon,
      BookOutlined: icon,
      SettingOutlined: icon,
      CodeOutlined: icon,
      UsergroupAddOutlined: icon,
      SlidersOutlined: icon,
      AlignLeftOutlined: icon,
    };
  },
  { virtual: true }
);

import { getSideMenuData } from "../../../../Frontend/src/data/side-menu-data";
import * as Routes from "../../../../Frontend/src/routes/page-routes";

describe("side-menu-data", () => {
  const router = { push: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns expected side menu items for admin", () => {
    const items: any[] = getSideMenuData(router, "admin") as any[];

    expect(items).toHaveLength(13);
    expect(items.map((item) => item.key)).toContain(Routes.SIDE_MENU_ROUTES.userManagemnt);
    expect(items[0].key).toBe(Routes.SIDE_MENU_ROUTES.home);
    expect(items[0].disabled).toBe(true);
  });

  it("returns expected side menu items for non-admin role", () => {
    const items: any[] = getSideMenuData(router, "viewer") as any[];

    expect(items).toHaveLength(13);
    expect(items.map((item) => item.key)).toContain(Routes.SIDE_MENU_ROUTES.graphPanel);
    expect(items.find((item) => item.key === Routes.SIDE_MENU_ROUTES.settings)?.disabled).toBe(true);
  });

  it("calls router.push when menu onClick is invoked", () => {
    const items: any[] = getSideMenuData(router, "admin") as any[];
    const graphPanelMenuItem = items.find((item) => item.key === Routes.SIDE_MENU_ROUTES.graphPanel);

    graphPanelMenuItem.onClick();

    expect(router.push).toHaveBeenCalledWith(Routes.SIDE_MENU_ROUTES.graphPanel);
  });
});
