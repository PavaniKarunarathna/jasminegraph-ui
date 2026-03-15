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

import { USER_ROLES } from "../../../../Frontend/src/data/user-data";

describe("user-data", () => {
  it("exports admin and viewer roles", () => {
    expect(USER_ROLES).toEqual([
      { value: "admin", label: "Admin" },
      { value: "viewer", label: "Viewer" },
    ]);
  });

  it("contains unique role values", () => {
    const values = USER_ROLES.map((role) => role.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
