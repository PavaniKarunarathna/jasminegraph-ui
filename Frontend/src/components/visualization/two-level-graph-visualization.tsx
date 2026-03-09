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

import { getGraphVizualization } from "@/services/graph-visualiztion";
import { Button, Card, message, Progress, Spin } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { LoadingOutlined } from "@ant-design/icons";
import "vis-network/styles/vis-network.css";
import { delay } from "@/utils/time";
import { IGraphDetails } from "@/types/graph-types";
import { Descriptions } from "antd";
import type { DescriptionsProps } from "antd";
import { useAppSelector } from "@/redux/hook";
import LowLevelGraphVisualization from "./low-level-graph-visualization";
import HighLevelGraphVisualization from "./high-level-graph-visualization";

const DEFAULT_TIMEOUT = 75;

export type INode = {
  id: number;
  label: string;
  shape: string;
  color: string;
  size?: number;
};

type IEdge = {
  from: number;
  to: number;
  properties?: any;
};

type Props = {
  graphID: any;
  graph: IGraphDetails | undefined;
  onPartitionClick: (partitionId: number | null | undefined) => Promise<void>;
};

const TwoLevelGraphVisualization = ({
  graphID,
  graph,
  onPartitionClick,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [progressing, setProgressing] = useState(false);
  const [percent, setPercent] = useState<number>(0);
  const [mode, setMode] = useState<"highView" | "lowView">("highView");
  const [selectedNode, setSelectedNode] = useState<number[] | null>(null);
  const [totalNoOfEdges, setTotalNoOfEdges] = useState<number | null>(null);
  const onLowLevelViewClick = async () => {
    setMode("lowView");
  };

  const onHighLevelViewClick = async () => {
    setMode("highView");
  };

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined spin />}
        fullscreen
      />
      {mode == "lowView" && (
        <LowLevelGraphVisualization totalNoOfEdges={totalNoOfEdges} onHighLevelViewClick={onHighLevelViewClick} />
      )}
      {mode == "highView" && (
        <HighLevelGraphVisualization graph={graph} graphID={graphID} onPartitionClick={onPartitionClick} onLowLevelViewClick={onLowLevelViewClick} selectedNode={selectedNode} setSelectedNode={setSelectedNode} setTotalNoOfEdges={setTotalNoOfEdges} />
      )}
      {progressing && <Progress percent={percent} showInfo={false} />}
    </div>
  );
};

export default TwoLevelGraphVisualization;
