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
      ContainerOutlined: icon,
      CodeSandboxOutlined: icon,
      SecurityScanOutlined: icon,
      AlignLeftOutlined: icon,
      DeploymentUnitOutlined: icon,
      AreaChartOutlined: icon,
    };
  },
  { virtual: true }
);

import {
  ClusterTopMenu,
  GraphPanelMenu,
  QueryInterfaceMenu,
} from "../../../../Frontend/src/data/menu-data";
import * as Routes from "../../../../Frontend/src/routes/page-routes";

describe("menu-data", () => {
  it("exports expected ClusterTopMenu items", () => {
    expect(ClusterTopMenu).toHaveLength(5);
    expect(ClusterTopMenu.map((item: any) => item.key)).toEqual([
      Routes.CLUSTER_PAGE_ROUTES.clusterDetails,
      Routes.CLUSTER_PAGE_ROUTES.accessManagement,
      Routes.CLUSTER_PAGE_ROUTES.instance,
      Routes.CLUSTER_PAGE_ROUTES.deployment,
      Routes.CLUSTER_PAGE_ROUTES.logs,
    ]);
    expect((ClusterTopMenu[3] as any).disabled).toBe(true);
    expect((ClusterTopMenu[4] as any).disabled).toBe(true);
  });

  it("exports expected GraphPanelMenu items", () => {
    expect(GraphPanelMenu).toHaveLength(4);
    expect(GraphPanelMenu.map((item: any) => item.key)).toEqual([
      Routes.GRAPH_PANEL_ROUTES.upload,
      Routes.GRAPH_PANEL_ROUTES.extract,
      Routes.GRAPH_PANEL_ROUTES.graph,
      Routes.GRAPH_PANEL_ROUTES.distribution,
    ]);
  });

  it("exports expected QueryInterfaceMenu items", () => {
    expect(QueryInterfaceMenu).toHaveLength(4);
    expect(QueryInterfaceMenu.map((item: any) => item.key)).toEqual([
      Routes.QUERY_PANEL_ROUTES.query,
      Routes.QUERY_PANEL_ROUTES.semantic_beam_search,
      Routes.QUERY_PANEL_ROUTES.properties,
      Routes.QUERY_PANEL_ROUTES.console,
    ]);
  });
});
