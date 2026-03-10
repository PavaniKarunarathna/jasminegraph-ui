/**
Copyright 2024 JasminGraph Team
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

export interface IGraphDetails {
  idgraph: number | string,
  name: string,
  centralpartitioncount: number | string,
  vertexcount: number
  edgecount: number,
  upload_path: string,
  status: string,
  partitions: IGraphPartitionDetails[],
}

export interface IGraphPartitionDetails {
  central_edgecount: number;
  central_edgecount_with_dups: number;
  central_vertexcount: number;
  edgecount: number;
  idpartition: number;
  vertexcount: number;
}

export interface IKnowledgeGraph {
    _id: string,
    graphId:string,
    name: string,
    status: string,
    hdfsIp: string,
    hdfsPort: string,
    hdfsFilePath: string,
    llmRunnerString: string,
    inferenceEngine: string,
    model: string,
    chunkSize: number,
    bytesPerSecond: number,
    triplesPerSecond: number,
    total: number;
    percentage: number;
    startTime: string;
    uploadPath: string;
    kgConstructionStatus:string;
    uploaded:number;


}
