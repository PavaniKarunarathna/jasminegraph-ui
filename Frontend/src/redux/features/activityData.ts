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

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ActivityError {
  id: string;
  title: string;
  message: string;
  time: string;
  menuItem: string;
}

interface IActivityData {
  errors: ActivityError[];
  isPanelOpen: boolean;
}

const initialData: IActivityData = {
  errors: [],
  isPanelOpen: false,
};

export const activityDataSlice = createSlice({
  name: "activityData",
  initialState: initialData,
  reducers: {
    add_error: (state, { payload }: PayloadAction<Omit<ActivityError, 'id' | 'time'>>) => {
      const error: ActivityError = {
        ...payload,
        id: `${payload.menuItem}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        time: new Date().toLocaleTimeString(),
      };
      state.errors.unshift(error);
      if (state.errors.length > 50) {
        state.errors = state.errors.slice(0, 50);
      }
    },
    remove_error: (state, { payload }: PayloadAction<string>) => {
      state.errors = state.errors.filter(error => error.id !== payload);
    },
    clear_all_errors: (state) => {
      state.errors = [];
    },
    clear_errors_by_menu_item: (state, { payload }: PayloadAction<string>) => {
      state.errors = state.errors.filter(error => error.menuItem !== payload);
    },
    toggle_activity_panel: (state) => {
      state.isPanelOpen = !state.isPanelOpen;
    },
    open_activity_panel: (state) => {
      state.isPanelOpen = true;
    },
    close_activity_panel: (state) => {
      state.isPanelOpen = false;
    },
  },
});

export const {
  add_error,
  remove_error,
  clear_all_errors,
  clear_errors_by_menu_item,
  toggle_activity_panel,
  open_activity_panel,
  close_activity_panel,
} = activityDataSlice.actions;

export default activityDataSlice.reducer;
