import { Button, Card, message, Spin } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { LoadingOutlined } from "@ant-design/icons";
import "vis-network/styles/vis-network.css";
import { IGraphDetails } from "@/types/graph-types";
import { Descriptions } from "antd";
import type { DescriptionsProps } from "antd";
import { useAppSelector } from "@/redux/hook";

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
  onLowLevelViewClick: () => void;
  selectedNode: number[] | null;
  setSelectedNode: React.Dispatch<React.SetStateAction<number[] | null>>;
};

const networkOptions = {
  nodes: {
    shape: "dot",
    size: 60,
    font: { size: 15 },
    color: { border: "#2B7CE9", background: "#97C2FC" },
  },
  edges: {
    color: { color: "#848484", highlight: "#848484", hover: "#848484" },
    width: 2,
  },
  autoResize: true,
};

const TwoLevelGraphVisualization = ({
  graphID,
  graph,
  onPartitionClick,
  onLowLevelViewClick,
  selectedNode,
  setSelectedNode
}: Props) => {
  const [loading, setLoading] = useState(false);
  const networkContainerRef = useRef<HTMLDivElement>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const nodesRef = useRef<any>(new DataSet([]));
  const edgesRef = useRef<any>(new DataSet([]));

  const lowLevelGraphData = useAppSelector(
    (state) => state.queryData.visualizeData
  );

  const loadHighLevelEdgeList = (): IEdge[] => {
    const edges: IEdge[] = [];
    const partitionCount = graph?.partitions.length || 0;
    console.log("PARTITION COUNT", partitionCount);
    for (let i = 0; i < partitionCount; i++) {
      for (let j = i + 1; j <= partitionCount; j++) {
        edges.push({ from: i, to: j, properties: `${i}-${j} edge` });
        console.log(i, j);
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

        // Validate node format
        const validatedNodes = graph.partitions.map((partition) => {
          return {
            id: partition.idpartition,
            label: partition.idpartition.toString(),
            shape: "dot",
            color: "#97c2fc",
            size: 60,
          };
        });

        // Validate edge format
        const validatedEdges = loadHighLevelEdgeList().map((edge: IEdge) => {
          const isValid = edge.from !== undefined && edge.to !== undefined;
          if (!isValid) {
            console.warn('Invalid edge:', edge);
          }
          return { ...edge };
        });

        if (validatedNodes.length === 0) {
          message.warning('No valid nodes found for low-level view.');
        }

        edgesRef.current.add(validatedEdges);
        nodesRef.current.add(validatedNodes);

        if (network) {
          network.setData({ nodes: nodesRef.current, edges: edgesRef.current });
          network.fit(); // Ensure the view is adjusted
        }
      } else {
        console.warn('No valid low-level graph data available for partition:', selectedNode);
        message.warning('No low-level graph data available for this partition.');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error while loading low-level graph data: ', err);
      message.error('Failed to load low-level graph data.');
      setLoading(false);
    }
  };

  const onViewGraph = async () => {
    if (nodesRef.current) {
      nodesRef.current.clear();
    }
    if (edgesRef.current) {
      edgesRef.current.clear();
    }
    await loadHighLevelView();
  };

  useEffect(() => {
    onViewGraph();
  }, [graphID]);

  useEffect(() => {
    if (!networkContainerRef.current) {
      console.error("Network container ref is not assigned");
      return;
    }

    // Optionally, add nodes from graph.partitions
    const nodes = graph?.partitions.map((partition) => {
      const node: INode = {
        id: partition.idpartition,
        label: `Partition ${partition.idpartition.toString()}`,
        shape: "dot",
        color: "#97c2fc",
        size: 30,
      };
      return node;
    });

    const edges: IEdge[] = loadHighLevelEdgeList();

    const network = new Network(
      networkContainerRef.current,
      { nodes: nodes, edges: edges },
      networkOptions
    );

    network.on("selectNode", (params) => {
      setSelectedNode(params.nodes);
    });

    // Event listener for edge selection
    network.on("selectEdge", (params) => {
      const selectedEdges = params.edges;
      console.log("Selected Edges:", selectedEdges);
    });

    // Event listener for edge deselection
    network.on("deselectNode", (params) => {
      setSelectedNode(params.nodes);
    });

    setNetwork(network);

    return () => {
      network.destroy();
    };
  }, []);

  useEffect(() => {
    const selectedNodes = network?.getSelectedNodes();
    console.log(selectedNodes);
  }, [network]);

  useEffect(() => {
    console.log("SELECTED::", selectedNode);
  }, [selectedNode]);

  const getDetails = () => {
    const partitionDetails = graph?.partitions.find(
      (g) => g.idpartition == selectedNode[0]
    );
    console.log("PARTITION DETAILS", graph, partitionDetails);
    const items: DescriptionsProps["items"] = [
      {
        key: "1",
        label: "vertexcount",
        children: `${partitionDetails?.vertexcount}`,
      },
      {
        key: "2",
        label: "edgecount",
        children: `${partitionDetails?.edgecount}`,
      },
      {
        key: "3",
        label: "central_vertexcount",
        children: `${partitionDetails?.central_vertexcount}`,
      },
      {
        key: "4",
        label: "central_edgecount",
        children: `${partitionDetails?.central_edgecount}`,
      },
      {
        key: "5",
        label: "central_edgecount_with_dups",
        children: `${partitionDetails?.central_edgecount_with_dups}`,
      },
    ];
    return items;
  };

  return (
    <div>
      <Spin
        spinning={loading}
        indicator={<LoadingOutlined spin />}
        fullscreen
      />
        <div
          style={{
            position: "relative",
            border: "1px solid red",
            height: "600px",
            aspectRatio: "16/9",
          }}
        >
          <div
            ref={networkContainerRef}
            style={{
              // width: '100%',
              height: "600px",
              border: "1px solid lightgray",
              backgroundColor: "#ffffff",
              aspectRatio: "16/9",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
            }}
          >
            {selectedNode && selectedNode?.length > 0 && (
              <Card variant="borderless" style={{ maxWidth: 300 }}>
                <Descriptions
                  column={1}
                  title={`Partition ${selectedNode}`}
                  items={getDetails()}
                />
                <Button
                  type="primary"
                  onClick={() => {
                    if(selectedNode && selectedNode.length > 0){
                      onPartitionClick(selectedNode[0])
                    }
                    onLowLevelViewClick();
                  }}
                >
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