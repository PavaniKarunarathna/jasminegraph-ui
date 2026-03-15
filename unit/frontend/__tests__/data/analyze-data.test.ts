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
  AnalyzeOptions,
  Analyzers,
  InputTypes,
  triangleCountAnalyzer,
} from "../../../../Frontend/src/data/analyze-data";

describe("analyze-data", () => {
  it("exports the triangle count option id", () => {
    expect(AnalyzeOptions.TRIANGLECOUNT).toBe("trian");
  });

  it("includes triangleCountAnalyzer in Analyzers list", () => {
    expect(Analyzers).toHaveLength(1);
    expect(Analyzers[0]).toBe(triangleCountAnalyzer);
  });

  it("defines priority as a select input with expected options", () => {
    const priority = triangleCountAnalyzer.inputParameters.priority;

    expect(priority.type).toBe(InputTypes.SELECT);
    expect(priority.label).toBe("Priority");
    expect(priority.options).toEqual([
      { value: "", label: "default" },
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
    ]);
  });

  it("keeps all input type enum values stable", () => {
    expect(InputTypes.SELECT).toBe("select");
    expect(InputTypes.INPUT).toBe("input");
    expect(InputTypes.INPUTNUMBER).toBe("input_number");
    expect(InputTypes.SWITCH).toBe("switch");
  });
});
