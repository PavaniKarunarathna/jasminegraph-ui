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
import React, { useEffect } from "react";
import { Space, Table, Tag, Button, Popconfirm, message, Spin } from "antd";
import type { TableProps } from 'antd';
import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { getGraphList, deleteGraph } from "@/services/graph-service";
import { IGraphDetails } from "@/types/graph-types";
import { useActivity } from "@/hooks/useActivity";

export default function GraphDetails() {
  const { reportErrorFromException } = useActivity();
  const [graphs, setGraphs] = React.useState<IGraphDetails[]>([]);
  const [loading, setLoading] = React.useState(false);

  const getGraphsData = async () => {
    try{
      setLoading(true);
      const res = await getGraphList();
      if(res.data){
      setGraphs(res.data);
    }
    }catch(err){
      message.error("Failed to fetch graphs: " + err);
      reportErrorFromException(
        "Graph Panel",
        err,
        "Failed to retrieve graph list from the server."
      );
    }
    finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    getGraphsData();
  }, [])

  const columns: TableProps<IGraphDetails>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Graph Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Vertex Count',
      dataIndex: 'vertexCount',
      key: 'vertexCount',
    },
    {
      title: 'Edge Count',
      dataIndex: 'edgeCount',
      key: 'edgeCount',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, { status }) => (
        <>
          {status == 'op' ? (
            <Tag color={'green'}>
              {"Active"}
            </Tag>) : (
            <Tag color={"volcano"}>
              {"Inactive"}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      render: (_: any, record: IGraphDetails) => (
        <Popconfirm
          title="Delete Graph"
          description={`Are you sure you want to delete this graph: ${record.idgraph} ?`}
          icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          onConfirm={async () => {
            try {
              await deleteGraph(record.idgraph.toString());
              message.success("Graph deleted successfully");
              getGraphsData();
            } catch (err) {
              message.error("Failed to delete graph");
              reportErrorFromException(
                "Graph Panel",
                err,
                "Failed to delete the selected graph."
              );
            }
          }
        }
        >
          <Button danger>Delete</Button>
        </Popconfirm>
      ),
    }
  ];

  return (
    <>
    <Spin spinning={loading} indicator={<LoadingOutlined spin />} fullscreen />
    <div style={{marginTop: "20px"}}>
      <Table columns={columns} dataSource={graphs} />
    </div>
    </>
  );
}
