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

export const SIDE_MENU_ROUTES = {
  home: "/",
  clusterPage: "/clusters",
  graphPanel: "/graph-panel",
  queryInterface: "/query-interface",
  performance: "/performance",
  logs: "/logs",
  queryExecution: "/query-execution",
  querySubmission: "/query-submission",
  notebook: "/notebook",
  userManagemnt: "/user-management",
  guides: "/guides",
  settings: "/settings",
  about: "/about",
};

export const CLUSTER_PAGE_ROUTES = {
  clusterDetails: "/",
  accessManagement: "/access-management",
  instance: "/instance",
  deployment: "/deployment",
  logs: "/logs",
};

export const GRAPH_PANEL_ROUTES = {
  upload: "/",
    extract: "/extract",
  graph: "/graph",
  distribution: "/distribution",
};

export const QUERY_PANEL_ROUTES = {
  query: "/",
    semantic_beam_search: "/semantic-beam-search",
  properties: "/properties",
  console: "/console"
};
