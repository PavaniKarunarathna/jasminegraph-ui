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

import {Alert, Button, Card, message, Spin} from "antd";
import React, {useEffect, useRef, useState} from "react";
import {DataSet, Network} from "vis-network/standalone";
import {LoadingOutlined} from "@ant-design/icons";
import "vis-network/styles/vis-network.css";
import {IGraphDetails} from "@/types/graph-types";
import {Descriptions} from "antd";
import {VISUALIZATION_VERTEX_LIMIT} from "@/properties";

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
    graphID: any,
    graph: IGraphDetails | undefined,
    onPartitionClick: (partitionId: number | null | undefined) => Promise<void>,
    onLowLevelViewClick: () => void,
    selectedNode: number[] | null,
    setSelectedNode: React.Dispatch<React.SetStateAction<number[] | null>>,
    setTotalNoOfEdges?: (value: (((prevState: (number | null)) => (number | null)) | number | null)) => void
};

// Default network options
const networkOptions = {
    nodes: {
        shape: "dot",
        font: {size: 15},
        color: {border: "#2B7CE9", background: "#97C2FC"},
    },
    edges: {
        color: {color: "#848484"},
        width: 2,
    },
    physics: {
        enabled: true,
        repulsion: {
            centralGravity: 0.1,       // less gravity → more spread
            springLength: 300,         // default is 100 → increase spacing
            springConstant: 0.01,
            nodeDistance: 300,          // force nodes to stay apart
            damping: 0.09,
        },
        solver: "repulsion"
    },
    layout: {
        improvedLayout: true,
        clusterThreshold: 500,
        // avoids node overlap even if sizes are large
        hierarchical: false,
    },
};

const TwoLevelGraphVisualization = ({
                                        graphID,
                                        graph,
                                        onPartitionClick,
                                        onLowLevelViewClick,
                                        selectedNode,
                                        setSelectedNode,
                                        setTotalNoOfEdges
                                    }: Props) => {
    const [loading, setLoading] = useState(false);
    const networkContainerRef = useRef<HTMLDivElement>(null);
    const [network, setNetwork] = useState<Network | null>(null);
    const nodesRef = useRef<any>(new DataSet([]));
    const edgesRef = useRef<any>(new DataSet([]));
    const [vertexCountExceed, setVertexCountExceed] = useState<boolean>(false);

    // Helper: scale vertexcount to node size
    const getNodeSize = (vertexCount: number, maxVertexCount: number) => {
        const minSize = 20;
        const maxSize = 100;
        const size = minSize + ((vertexCount / maxVertexCount) * (maxSize - minSize));
        return size;
    };

    const loadHighLevelEdgeList = (): IEdge[] => {
        const edges: IEdge[] = [];
        const partitionCount = graph?.partitions.length || 0;
        for (let i = 0; i < partitionCount; i++) {
            for (let j = i + 1; j < partitionCount; j++) {
                edges.push({from: graph!.partitions[i].idpartition, to: graph!.partitions[j].idpartition});
            }
        }
        return edges;
    };

    const loadHighLevelView = async () => {
        try {
            setLoading(true);
            nodesRef.current.clear();
            edgesRef.current.clear();

            if (graph && graph.partitions && Array.isArray(graph.partitions)) {
                // Create nodes with size proportional to vertexcount
                const maxVertexCount = Math.max(...graph.partitions.map(p => p.vertexcount));

                const validatedNodes = graph.partitions.map((partition) => ({
                    id: partition.idpartition,
                    label: partition.idpartition.toString(),
                    shape: "dot",
                    color: "#97c2fc",
                    size: getNodeSize(partition.vertexcount, maxVertexCount),
                }));
                // Create edges
                const validatedEdges = loadHighLevelEdgeList();

                edgesRef.current.add(validatedEdges);
                nodesRef.current.add(validatedNodes);

                if (network) {
                    network.setData({nodes: nodesRef.current, edges: edgesRef.current});
                    network.fit();
                }
            }
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const onViewGraph = async () => {
        nodesRef.current.clear();
        edgesRef.current.clear();
        await loadHighLevelView();
    };

    useEffect(() => {
        onViewGraph();
    }, [graphID]);

    useEffect(() => {
        if (!networkContainerRef.current) return;

        const maxVertexCount = Math.max(
            0, // default value if partitions is empty
            ...(graph?.partitions?.map(p => p.vertexcount) ?? [])
        );
        const nodes = graph?.partitions.map((partition) => ({
            id: partition.idpartition,
            label: partition.idpartition.toString(),
            shape: "dot",
            color: "#97c2fc",
            size: getNodeSize(partition.vertexcount, maxVertexCount),
        }));
        const edges: IEdge[] = loadHighLevelEdgeList();

        const net = new Network(
            networkContainerRef.current,
            {nodes: nodes || [], edges},
            networkOptions
        );

        net.on("selectNode", (params) => setSelectedNode(params.nodes));
        net.on("deselectNode", (params) => setSelectedNode(params.nodes));

        setNetwork(net);

        return () => net.destroy();
    }, [graph]);

    const getDetails = () => {
        const partitionDetails = graph?.partitions.find(
            (g) => selectedNode && g.idpartition === selectedNode[0]
        );
        return [
            {key: "1", label: "vertexcount", children: `${partitionDetails?.vertexcount}`},
            {key: "2", label: "edgecount", children: `${partitionDetails?.edgecount}`},
            {key: "3", label: "central_vertexcount", children: `${partitionDetails?.central_vertexcount}`},
            {key: "4", label: "central_edgecount", children: `${partitionDetails?.central_edgecount}`},
            {
                key: "5",
                label: "central_edgecount_with_dups",
                children: `${partitionDetails?.central_edgecount_with_dups}`
            },
        ];
    };

    const onLowLevelView = async () => {
        const nodeDetails = graph?.partitions.find(
            (g) => selectedNode && g.idpartition === selectedNode[0]
        );

        if (!nodeDetails) {
            message.warning("No node details found for the selected node.");
            return;
        }
        setVertexCountExceed(false);

        if (selectedNode && selectedNode.length > 0) {
            if (setTotalNoOfEdges) {
                setTotalNoOfEdges(nodeDetails?.edgecount)
            }
            await onPartitionClick(selectedNode[0]);

        }
        onLowLevelViewClick();
    };

    return (
        <div>
            <Spin spinning={loading} indicator={<LoadingOutlined spin/>} fullscreen/>
            {vertexCountExceed && (
                <Alert
                    message={`Vertex count exceeds ${VISUALIZATION_VERTEX_LIMIT}. Cannot view low-level graph.`}
                    type="warning"
                />
            )}
            <div style={{

                position: "relative",
                width: "150%",
                maxWidth: "1400px",
                height: "calc(100vh - 150px)",
                margin: "0 auto",
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                background: "#fff",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
            }}>
                <div
                    ref={networkContainerRef}
                    style={{
                        height: "600px",
                        backgroundColor: "#ffffff",
                        aspectRatio: "16/9"
                    }}
                />
                <div style={{position: "absolute", top: "10px", right: "10px"}}>
                    {selectedNode && selectedNode.length > 0 && (
                        <Card style={{maxWidth: 300}}>
                            <Descriptions column={1} title={`Partition ${selectedNode}`} items={getDetails()}/>
                            <Button type="primary" onClick={() => onLowLevelView()}>
                                View Graph
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TwoLevelGraphVisualization;
