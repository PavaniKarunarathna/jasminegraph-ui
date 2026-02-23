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

import { configureStore } from "@reduxjs/toolkit";
// Slices
import appDataSlice from "./features/appData";
import authDataSlice from "./features/authData";
import clusterDataSlice from "./features/clusterData";
import cacheDataSlice from "./features/cacheSlice";
import queryDataSlice from "./features/queryData";
import activityDataSlice from "./features/activityData";

export const store = configureStore({
  reducer: {
    appData: appDataSlice,
    authData: authDataSlice,
    clusterData: clusterDataSlice,
    cacheData: cacheDataSlice,
    queryData: queryDataSlice,
    activityData: activityDataSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
