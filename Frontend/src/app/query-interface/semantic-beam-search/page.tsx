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
import React, { useState, useEffect }  from "react";
import {Input, message, Spin, Table, Tabs} from 'antd';
import type { TabsProps } from "antd";
import { CaretRightOutlined, LoadingOutlined} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { add_semantic_result, clear_result} from "@/redux/features/queryData";
import { Select } from 'antd';
import { getGraphList } from "@/services/graph-service";
import QueryVisualization from "@/components/visualization/query-visualization";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { IOption } from "@/types/options-types";
import { useActivity } from "@/hooks/useActivity";

type TabItem = Required<TabsProps>['items'][number];

const { TextArea } = Input;

const WS_URL = "ws://localhost:8080";

export default function SemanticBeamSearchPage() {
  const dispatch = useAppDispatch();
  const { reportErrorFromException } = useActivity();
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, { shouldReconnect: (closeEvent) => true });
  const [clientId, setClientID] = useState<string>('')

  const { messagePool } = useAppSelector((state) => state.queryData);

  const [selectedGraph, setSelectedGraph] = React.useState<any>();
  const [graphs, setGraphs] = React.useState<any[]>([]);

  const getGraphsData = async () => {
    try{
        setLoading(true);
    const res = await getGraphList();
    if(res.data){
        setLoading(false);
      const filteredData: IOption[] = res.data.map((graph: any) => {
        return {
          value: graph.idgraph,
          label: graph.name,
        }
      })
      setGraphs(filteredData);
    }
    }catch(err){
      message.error("Failed to fetch graphs: " + err);
      reportErrorFromException(
        "Query Interface",
        err,
        "Failed to fetch the list of graphs."
      );
      setLoading(false);
    }
  }

  useEffect(() => {

    getGraphsData();
  }, [])

  const handleChange = (value: string) => {
    setSelectedGraph(value);
  };

  useEffect(() => {
    const message = lastJsonMessage as any;
    if(!message) return;
    if(message?.type == "CONNECTED"){
      setClientID(message?.clientId || '')
    } else {
      dispatch(add_semantic_result(message));
    }
  }, [lastJsonMessage])

  const onQuerySubmit = async () => {
    try{
      setLoading(true);
      dispatch(clear_result());
      if(readyState === ReadyState.OPEN){
        sendJsonMessage({
          type: "SBS",
          query,
          graphId: selectedGraph,
          clientId: clientId,
          clusterId: localStorage.getItem("selectedCluster")
        })
      }   
    }catch (err){
      console.log("ERROR::", err)
    }finally{
      setLoading(false)
    }
  }

  // Get all unique keys from the data
  const allKeys = Object.keys(messagePool)
  const categories = Object.keys(messagePool);

  // Transform data into rows
  const maxRows = Math.max(...categories.map((key) => messagePool[key].length));
  const dataSource = Array.from({ length: maxRows }, (_, rowIndex) => {
    const row: Record<string, any> = { key: rowIndex.toString() };

    categories.forEach((category) => {
      row[category] = messagePool[category][rowIndex]
        ? JSON.stringify(messagePool[category][rowIndex], null, 2)
        : ""; // Empty if no data
    });

    return row;
  });

  const columns = categories.map((category) => ({
    title: category, // Column Name
    dataIndex: category,
    key: category,
  }));

  const tabItems: TabItem[] = [
    {
      key: '1',
      label: 'Table View',
      children: 
        <>
          <Table
            dataSource={dataSource}
            columns={columns}
            rowKey="id" // Use 'id' as the unique row identifier
            pagination={{ pageSize: 20 }}
            scroll={{ y: 90 * 5 }}
            size="small"
          />
        </>,
    },
    {
      key: '2',
      label: 'Graph View',
      children: <div style={{width: "80%"}}>
        <QueryVisualization />
      </div>
    }
  ]

  return (
    <div className="">
        <Spin spinning={loading} indicator={<LoadingOutlined spin />} fullscreen />
      <div style={{display: "flex", justifyContent: "space-between", width: "100%", border: "1px solid #d9d9d9", borderRadius: "8px", padding: "10px", margin: "15px 0px", gap: "10px"}}>
        <Select
            placeholder={'Graph'}
            style={{ width: 120 }}
            onChange={handleChange}
            value={selectedGraph}
            options={graphs}
            size="large"
          />
        <div style={{width: "90%"}}>
          <TextArea 
            placeholder="Semantic Search ..."
            onChange={(e) => setQuery(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 7 }}
            size="large"
            style={{ fontWeight: "500"}}
          />
        </div>
        <CaretRightOutlined style={{fontSize: "24px", margin: "2px", padding: "0px 10px"}} onClick={onQuerySubmit}/>
      </div>
      {Object.keys(messagePool).length > 0 && (
        <Tabs
          type="card"
          items={tabItems}
        />
      )}
    </div>
  );
}
