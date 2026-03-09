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
'use client';
import { Progress, Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { DataSet, Network } from 'vis-network/standalone';
import { LoadingOutlined } from '@ant-design/icons';
import 'vis-network/styles/vis-network.css';
import { useAppSelector } from '@/redux/hook';
import randomColor from 'randomcolor';
const QueryVisualization = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [progressing, setProgressing] = useState<boolean>(false);
    const [percent, setPercent] = useState<number>(0);
    const networkContainerRef = useRef(null);
    const nodesRef = useRef<any>(null);
    const edgesRef = useRef<any>(null);
    const { messagePool } = useAppSelector((state) => state.queryData);
    const PARTITION_COLORS = [

      '#6CB8E6', // lighter (still visible)
      '#5FA8E6', // bright but visible
      '#4E9CD3', // medium sky blue
      '#3A86B8', // classic blue
      '#2C73A8', // strong blue
      '#1F5A8A', // steel blue
      '#123E6B', // dark blue
      '#0B3C5D', // deep navy
    ];


    /**
     * ✅ Extract relations (edges) safely, even if no pathObj present
     */
    const extractRelations = (message: any): any[] => {
        const edges: any[] = [];
        try {
            if (message?.pathRels && message?.pathNodes) {
                const pathNodes = message?.pathNodes;
                const pathRels = message?.pathRels;
                for (let i = 0; i < pathRels.length && i < pathNodes.length - 1; i++) {
                    const rel = pathRels[i];
                    const source = pathNodes[i].id;
                    const target = pathNodes[i + 1].id;
                    edges.push({
                        id: `${source}_${rel.type}_${target}`,
                        from: source,
                        to: target,
                        label: rel.type || 'related_to',
                        title: rel.description || rel.type,
                        arrows: 'to',
                        color: { color: '#888' },
                    });
                }
            } else if (message.from && message.to) {
                edges.push({
                    id: `${message.from}_${message.label || 'rel'}_${message.to}`,
                    from: message.from,
                    to: message.to,
                    label: message.label || 'related_to',
                    title: message.description || '',
                    arrows: 'to',
                    color: { color: '#888' },
                });
            }
        } catch (err) {
            console.warn('Error extracting relations:', err);
        }
        return edges;
    };

    /**
     * ✅ Build nodes + edges from messagePool dynamically
     */
    const RefreshGraph = (): { nodes: any[]; edges: any[] } => {
        const colorMap = new Map<number, string>(); // Map partitionID to color
        const existingNodeIds = new Set<string>();
        const existingEdgeIds = new Set<string>();
        const dataNode: any[] = [];
        const dataEdge: any[] = [];

        setLoading(true);
        setProgressing(true);

        Object.keys(messagePool).forEach((key) => {
            const messages = messagePool[key];
            messages.forEach((msg: any) => {
                try {
                    const json = typeof msg === 'string' ? JSON.parse(msg) : msg;
                    const pathNodes = json?.pathNodes || [];
                    if (pathNodes.length === 0) return;

                    // --- Determine seed node partitionID ---
                    const seedNode = pathNodes[0].id ?? 0;

                    // --- Assign colors based on partitionID relative to seed ---
                    pathNodes.forEach((n: any) => {
                        const partition = n.partitionID ?? 0;

                        // Create a color for this partitionID if not already
                        if (!colorMap.has(partition)) {
                            // Seed node partition gets a distinct color
                            if (n.id === seedNode) {
                                colorMap.set(seedNode, '#FF5733'); // example: red/orange for seed
                            } else {
                                const color = PARTITION_COLORS[partition % PARTITION_COLORS.length];
                                colorMap.set(partition, color);
                            }
                        }

                        if (!existingNodeIds.has(n.id)) {
                            existingNodeIds.add(n.id);

                            dataNode.push({
                                id: n.id,
                                label: n.name || n.id,
                                group: n.label,
                                color: n.id==seedNode?colorMap.get(seedNode):colorMap.get(partition),
                                title: `${n.label} (partition ${partition})`,
                            });
                        }
                    });

                    // --- Build Edges ---
                    const relations = extractRelations(json);
                    relations.forEach((edge: any) => {
                        if (!existingEdgeIds.has(edge.id)) {
                            existingEdgeIds.add(edge.id);
                            dataEdge.push(edge);
                        }
                    });
                } catch (err) {
                    console.warn('Invalid message:', err);
                }
            });
        });

        setLoading(false);
        setProgressing(false);
        setPercent(100);
        return { nodes: dataNode, edges: dataEdge };
    };


    useEffect(() => {
        if (!networkContainerRef.current) return;

        nodesRef.current = new DataSet([]);
        edgesRef.current = new DataSet([]);

        const options: import('vis-network').Options = {
            layout: {
                improvedLayout: true,
                hierarchical: false,
            },
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -5000, // Stronger repulsion => more space between nodes
                    centralGravity: 0.1,
                    springLength: 100,             // Increase for more spacing
                    springConstant: 0.02,
                    damping: 0.09,
                },
                stabilization: {
                    iterations: 2000,
                },
            },
            nodes: {
                shape: 'dot',
                size: 60,
                font: { size: 15 },
                color: { border: '#2B7CE9', background: '#97C2FC' },
            },
            edges: {
                color: { color: '#848484', highlight: '#848484', hover: '#848484' },
                width: 2,
                smooth: {
                    enabled: true,       // ✅ Required field
                    type: 'dynamic',
                    roundness: 0.5,      // ✅ Required field
                },
            },
            autoResize: true,
        };


        // ✅ Initialize the network
        const network = new Network(
            networkContainerRef.current,
            { nodes: nodesRef.current, edges: edgesRef.current },
            options
        );

        // ✅ Fetch and add nodes + edges separately
        const { nodes: dataNode, edges: dataEdge } = RefreshGraph();
        nodesRef.current.add([...dataNode]);
        edgesRef.current.add([...dataEdge]);

        return () => {
            network.destroy();
        };
    }, []);

    return (
        <div>
            <Spin spinning={loading} indicator={<LoadingOutlined spin />} fullscreen />
            <div
                ref={networkContainerRef}
                style={{
                    width: "150%",
                    maxWidth: "1400px",
                    height: "calc(100vh - 150px)",
                    border: '1px solid lightgray',
                    backgroundColor: '#ffffff',
                }}
            ></div>
            {progressing && <Progress percent={percent} showInfo={false} />}
        </div>
    );
};

export default QueryVisualization;
