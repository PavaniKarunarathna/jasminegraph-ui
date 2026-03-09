/**
Copyright 2025 JasmineGraph Team
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

import { GRAPH_TYPES, GraphType } from "@/data/graph-data";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface  IUpBytesResponse{
    type:string;
    updates :any[];
    timestamp: string;
}

interface IQueryData {
  messagePool: Record<string, any[]>;
  visualizeData: {
    node: any[];
    edge: any[];
    render: boolean;
    updateProgress:boolean;
  }
  inDegreeDataPool: any[];
  outDegreeDataPool: any[];
  uploadBytes:IUpBytesResponse;
}

const initialData: IQueryData = {
  messagePool: {},
  visualizeData: {
    node: [],
    edge: [],
      render: false,
    updateProgress:false,
  },
  inDegreeDataPool: [],
  outDegreeDataPool: [],
    uploadBytes: {
        type: "",
        updates: [],
        timestamp: ""
    }

};

export const queryDataSlice = createSlice({
  name: "queryData",
  initialState: initialData,
  reducers: {
    add_query_result: (state, {payload}: {payload: any}) => {
      const key = Object.keys(payload)[0];
      const node = payload[key];
      
      if (!state.messagePool[key]) {
        state.messagePool[key] = [];
      }

      if(node){
        state.messagePool[key].push(node);
      }
    },
      add_semantic_result: (state, {payload}: {payload: any}) => {
          const keys = Object.keys(payload);
          keys.forEach((key) => {
            if (key != "hop") {


              const row = payload[key];

              if (!state.messagePool[key]) {
                state.messagePool[key] = [];
              }

              if (row) {
                state.messagePool[key].push(row);
              }
            }
          })
      },

      add_upload_bytes: (state, {payload}: {payload: any}) => {
          state.uploadBytes = payload;
      },

    add_visualize_data: (state, { payload }) => {


      const keys = Object.keys(payload);
      if(keys.includes("done")){
          state.visualizeData.render = true;
        state.visualizeData.updateProgress= !state.visualizeData.updateProgress;

      }
      if(state.visualizeData.edge.length % 100 == 0){
        state.visualizeData.updateProgress= !state.visualizeData.updateProgress;
      }
      const firstNode = { ...payload[keys[0]] };
      const firstPartition = firstNode.partitionID
      const secondNode = { ...payload[keys[1]] };
        const secondPartition = secondNode.partitionID
      const relation = payload[keys[2]];
      if(firstNode && secondNode && firstNode.id && secondNode.id){
        state.visualizeData.edge.push({ from: firstNode?.id, to: secondNode?.id , label: relation?.type});
      }
    
      // Process each key to add nodes, avoiding duplicates
      keys.forEach((key) => {
          if(key!=="r") {
        const node = { ...payload[key] };
        if (node && node.id) {
          // Check if a node with the same id already exists
          const nodeExists = state.visualizeData.node.some(
            (existingNode) => existingNode.id === node.id
          );
          if (!nodeExists) {
              let color = '#97C2FC'
              if( node.partitionID != secondPartition ){
                  color = '#6590C4'
              }
            state.visualizeData.node.push({...node, color:color})
          }
        }};
      });
    },
    add_degree_data: (state, action: PayloadAction<{data: any, type: GraphType}>) => {
      if(action.payload.type == GRAPH_TYPES.INDEGREE){
        state.inDegreeDataPool.push(action.payload.data);
      }else if(action.payload.type == GRAPH_TYPES.OUTDEGREE){
        state.outDegreeDataPool.push(action.payload.data)
      }
    },
    clear_result: (state) => {
      state.messagePool = {};
    },
    clear_degree_data: (state, action: PayloadAction<GraphType>) => {
      if(action.payload == GRAPH_TYPES.INDEGREE){
        state.inDegreeDataPool = [];
      }else if(action.payload == GRAPH_TYPES.OUTDEGREE){
        state.outDegreeDataPool = [];
      }
    },
    clear_visualize_data: (state) => {
      state.visualizeData = {
        node: [],
        edge: [],
          render: false,
        updateProgress: false,
      };
    },
  },
});

export const {
  add_query_result,
    add_semantic_result,
    add_upload_bytes,
  clear_result,
  add_visualize_data,
  clear_visualize_data,
  add_degree_data,
  clear_degree_data
} = queryDataSlice.actions;

export default queryDataSlice.reducer;
