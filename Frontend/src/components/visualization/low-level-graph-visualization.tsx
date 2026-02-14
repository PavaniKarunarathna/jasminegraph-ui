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
"use client";

import {Button, Card, Progress, Spin, Descriptions} from "antd";
import React, {useEffect, useRef, useState} from "react";
import {LeftOutlined} from "@ant-design/icons";
import {useAppSelector} from "@/redux/hook";
import randomColor from "randomcolor";
import Graph from "graphology";
import Sigma from "sigma";
import FA2 from "graphology-layout-forceatlas2";

interface Props {
    onHighLevelViewClick: () => void,
    totalNoOfEdges?: number | null
}

interface INode {
    name: any;
    id: number;
    label: string;
    partitionID?: number;
    color?: string;
}

interface IEdge {
    type: string;
    from: number;
    to: number;
    label?: string;
}

const LowLevelGraphVisualization = ({ onHighLevelViewClick, totalNoOfEdges}: Props) => {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
    const [hoveredNode, setHoveredNode] = useState<any | null>(null);
    const [hoveredEdge, setHoveredEdge] = useState<any | null>(null);
    const [retrievedAt, setRetrievedAt] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);
    const partitionColorMap = useRef<Map<number, string>>(new Map());

    const lowLevelGraphData = useAppSelector((state) => state.queryData.visualizeData);
    const isRender = useAppSelector((state) => state.queryData.visualizeData.render);
    const updateProgress = useAppSelector((state) => state.queryData.visualizeData.updateProgress);

    const getColor = (partitionID: number) => {
        if (!partitionColorMap.current.has(partitionID)) {
            partitionColorMap.current.set(partitionID, randomColor({luminosity: "bright"}));
        }
        return partitionColorMap.current.get(partitionID)!;
    };

    const handleSearch = (query: string) => {
        if (!query || query == "" || !graphRef.current || !rendererRef.current) return;

        const graph = graphRef.current;
        const renderer = rendererRef.current;
        const camera = renderer.getCamera();
        const lowerQuery = query.toLowerCase();

        const matchedNodes: string[] = [];

        // Search by ID and attributes
        graph.forEachNode((node: string, attrs: any) => {
            if (node.toString().includes(lowerQuery)) {
                matchedNodes.push(node);
            } else {
                for (const key in attrs) {
                    const value = attrs[key];
                    if (value != null && String(value).toLowerCase().includes(lowerQuery)) {
                        matchedNodes.push(node);
                        break;
                    }
                }
            }
        });

        if (matchedNodes.length === 0) return;

        // Reset all highlights
        graph.forEachNode((node: string) => graph.setNodeAttribute(node, "highlighted", false));
        graph.forEachEdge((edge: string) => graph.setEdgeAttribute(edge, "highlighted", false));

        // Highlight matched nodes
        matchedNodes.forEach((node) => graph.setNodeAttribute(node, "highlighted", true));

        // Highlight edges connecting matched nodes
        graph.forEachEdge((edge: string, attr: any, source: string, target: string) => {
            if (matchedNodes.includes(source) && matchedNodes.includes(target)) {
                graph.setEdgeAttribute(edge, "highlighted", true);
            }
        });

        // Optionally zoom to fit all matched nodes
        const positions = matchedNodes.map((node) => renderer.getNodeDisplayData(node)).filter(Boolean);
        if (positions.length > 0) {
            const xValues = positions.map((p) => p!.x);
            const yValues = positions.map((p) => p!.y);
            const minX = Math.min(...xValues);
            const maxX = Math.max(...xValues);
            const minY = Math.min(...yValues);
            const maxY = Math.max(...yValues);
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const ratio = Math.max(maxX - minX, maxY - minY) / 400 + 0.1; // adjust zoom factor
            camera.animate({x: centerX, y: centerY, ratio}, {duration: 700, easing: "linear"});
        }
    };


    // Initialize Sigma once
    useEffect(() => {
        const initGraph = async () => {
            if (typeof window === "undefined" || !containerRef.current) return;
            setRetrievedAt(new Date().toLocaleString());
            const graph = new Graph({multi: true, type: "directed"});
            graphRef.current = graph;

            const renderer = new Sigma(graph, containerRef.current, {renderLabels: true, renderEdgeLabels: true});
            rendererRef.current = renderer;
            // --- HOVER TOOLTIP EVENTS ---
            renderer.on("enterNode", ({ node }) => {
                const attrs = graph.getNodeAttributes(node);
                setHoveredNode({ id: node, ...attrs });

                const neighbors = new Set(graph.neighbors(node));

                // Show only hovered node and its neighbors
                graph.forEachNode((n) => {
                    const visible = n === node || neighbors.has(n);

                    graph.setNodeAttribute(n, "hidden", !visible);
                    graph.setNodeAttribute(n, "highlighted", visible);
                });

                // Show only edges connected to the hovered node
                graph.forEachEdge((edge, attr, source, target) => {
                    const visible =
                        source === node ||
                        target === node ||
                        (neighbors.has(source) && neighbors.has(target));

                    graph.setEdgeAttribute(edge, "hidden", !visible);
                    graph.setEdgeAttribute(edge, "highlighted", visible);
                });
            });


            renderer.on("leaveNode", () => {
                graph.forEachNode((n) => {
                    graph.setNodeAttribute(n, "hidden", false);
                    graph.setNodeAttribute(n, "highlighted", false);
                });

                graph.forEachEdge((e) => {
                    graph.setEdgeAttribute(e, "hidden", false);
                    graph.setEdgeAttribute(e, "highlighted", false);
                });

                setHoveredNode(null);
            });



            renderer.on("enterEdge", ({edge}) => {
                const attrs = graph.getEdgeAttributes(edge);
                setHoveredEdge({id: edge, ...attrs});
            });



            renderer.on("leaveEdge", () => {
                setHoveredEdge(null);
            });
              };

        initGraph();
    }, []);

    useEffect(() => {

        if(totalNoOfEdges || totalNoOfEdges != 0){
                setProgress(Math.round((lowLevelGraphData.edge.length / totalNoOfEdges) * 100));
                // count++;


        }
    }, [updateProgress]);
    // Incremental updates
    useEffect(() => {
        const updateGraph = async () => {
            if (!graphRef.current || !lowLevelGraphData) return;


            const graph = graphRef.current;
            const nodes: INode[] = lowLevelGraphData.node || [];
            const edges: IEdge[] = lowLevelGraphData.edge || [];

            const total = nodes.length + edges.length;
            let count = 0;

            // Add nodes
            nodes.forEach((n) => {
                if (!graph.hasNode(n.id)) {
                    graph.addNode(n.id, {
                        ...n,
                        category: n.label,
                        label: n.name,
                        size: 3,
                        color: n.color ?? getColor(n.partitionID ?? 0),
                        x: (Math.random() - 0.5) * 20,
                        y: (Math.random() - 0.5) * 20,
                    });
                }
                count++;
            });

            // Add edges
            edges.forEach((e) => {
                if (
                    graph.hasNode(e.from) &&
                    graph.hasNode(e.to) &&
                    !graph.hasEdge(e.from, e.to)
                ) {
                    graph.addEdge(e.from, e.to, {
                        ...e,              // <-- add ALL properties of the edge
                        from: e.from,      // ensure consistent ID
                        to: e.to,
                        label: e.label ?? "test",
                    });
                }

                count++;
            });

            // Degree-based node sizing
            graph.forEachNode((node: string, attr: any) => {
                const degree = graph.degree(node);
                graph.setNodeAttribute(node, "size", Math.log(degree + 1) * 2 + 2);
            });


            // Light layout smoothing
            FA2.assign(graph, {iterations: 200, settings: {gravity: 5}});
            if (isRender) {
                setLoading(false);
            }
        };

        updateGraph();
    }, [isRender]);

    const getNodeDetails = () => {
        if (!selectedNodeId) return [];
        const node = lowLevelGraphData.node.find((n: any) => n.id === selectedNodeId);
        if (!node) return [];
        return Object.keys(node).map((k, i) => ({
            key: i.toString(),
            label: k,
            children: String(node[k]),
        }));
    };

    return (
        <div style={{width: "100%", height: "100%"}}>

            <div
                style={{
                    position: "relative",
                    width: "150%",
                    maxWidth: "1400px",
                    height: "calc(100vh - 150px)",
                    margin: "0 auto",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    background: "#fff",
                    overflow: "hidden",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                }}
            >
                {/* Search bar */}
                <div
                    style={{
                        position: "absolute",
                        top: 16,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 20,
                        width: 300,
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search node by ID or label..."
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid #ccc",
                            fontSize: 14,
                        }}
                    />
                </div>

                <div ref={containerRef} style={{width: "100%", height: "100%"}}>
                    {loading && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                background: "rgba(255, 255, 255, 0.7)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1000,
                                flexDirection: "column",
                            }}
                        >
                            <Spin size="large" tip={`Loading... ${progress}%`}/>
                            <div style={{marginTop: 12}}>
                                <Progress
                                    percent={progress}
                                    showInfo
                                    strokeColor={{from: "#108ee9", to: "#87d068"}}
                                    style={{width: 200}}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Hover Tooltip */}
                {hoveredNode && (
                    <div style={{position: "absolute", top: 16, right: 16, zIndex: 10}}>
                        <Card
                            size="small"
                            style={{maxWidth: 320, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"}}
                        >
                            <div><b>ID:</b> {hoveredNode.id}</div>


                            {Object.entries(hoveredNode).map(([key, value]) =>
                                key !== "id" && key !== "label" &&  key !== "highlighted" && key !== "x" && key !== "y" && key !== "color" && key !== "size" ? (
                                    <div key={key}>
                                        <b>{key}:</b> {String(value)}
                                    </div>
                                ) : null
                            )}
                        </Card>
                    </div>
                )}
                {hoveredEdge && (
                    <div style={{position: "absolute", top: 16, right: 16, zIndex: 10}}>
                        <Card
                            size="small"
                            style={{maxWidth: 320, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"}}
                        >
                            <div><b>Edge:</b> {hoveredEdge.id}</div>
                            {Object.entries(hoveredEdge).map(([k, v]) => (
                                <div key={k}><b>{k}:</b> {String(v)}</div>
                            ))}
                        </Card>
                    </div>
                )}

                {/* Node details panel */}
                {selectedNodeId && (
                    <div style={{position: "absolute", top: 16, right: 16, zIndex: 10}}>
                        <Card
                            size="small"
                            style={{maxWidth: 320, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"}}
                        >
                            <Descriptions column={1} title={`Node ${selectedNodeId}`} items={getNodeDetails()}/>
                        </Card>
                    </div>
                )}

                {/* Back button */}
                <div style={{position: "absolute", top: 16, left: 16, zIndex: 10}}>
                    <Button
                        type="primary"
                        icon={<LeftOutlined/>}
                        size="large"
                        shape="circle"
                        onClick={onHighLevelViewClick}
                    />
                </div>
                {retrievedAt && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 16,       // move to bottom
                            right: 16,        // keep on right
                            zIndex: 15,
                            background: "#ffffffcc",
                            padding: "6px 10px",
                            borderRadius: 8,
                            fontSize: 12,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                        }}
                    >

                        {retrievedAt}
                    </div>
                )}
            </div>
        </div>

    );
};

export default LowLevelGraphVisualization;
