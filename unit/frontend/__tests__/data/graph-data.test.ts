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

import {
  GRAPH_TYPES,
  GRAPH_VISUALIZATION_TYPE,
} from "../../../../Frontend/src/data/graph-data";

describe("graph-data", () => {
  it("exports graph type constants", () => {
    expect(GRAPH_TYPES).toEqual({
      INDEGREE: "in_degree",
      OUTDEGREE: "out_degree",
    });
  });

  it("defines expected graph visualization options", () => {
    expect(GRAPH_VISUALIZATION_TYPE).toEqual([
      { value: "full_view", label: "Full View" },
      { value: "in_degree", label: "In Degree" },
      { value: "out_degree", label: "Out Degree" },
    ]);
  });

  it("keeps in_degree and out_degree options mapped to GRAPH_TYPES", () => {
    const inDegree = GRAPH_VISUALIZATION_TYPE.find((x) => x.value === GRAPH_TYPES.INDEGREE);
    const outDegree = GRAPH_VISUALIZATION_TYPE.find((x) => x.value === GRAPH_TYPES.OUTDEGREE);

    expect(inDegree?.label).toBe("In Degree");
    expect(outDegree?.label).toBe("Out Degree");
  });
});
