export const VISUALIZATION_VERTEX_LIMIT= 1000;

export const GRAFANA_BASE_URL = process.env.NEXT_PUBLIC_GRAFANA_BASE_URL;

export const GRAFANA_DASHBOARD = {
  uid: "beg67s27j6oe8b",
  slug: "jasminegraph-performance",
  baseUrl: GRAFANA_BASE_URL
};

export const LOKI_EXPLORE = {
  url: `${GRAFANA_BASE_URL}/a/grafana-lokiexplore-app/explore`,
};
