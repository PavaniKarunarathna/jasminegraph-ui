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

"use client";
import React, { useState, useEffect } from "react";
import {
  theme,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
} from 'antd';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { Analyzers, GraphAnalyzer, InputParam, InputTypes } from "@/data/analyze-data";
import { getGraphList } from "@/services/graph-service";
import { ISelectProp } from "@/types/user-types";
import type { FormProps } from 'antd';
import { analyzeGraph } from "@/services/analyzer-service";
import { useActivity } from "@/hooks/useActivity";

// Render input field based on InputTypes
const renderInputField = (key: string, inputParam: InputParam) => {
  switch (inputParam.type) {
    case InputTypes.INPUT:
      return (
        <Form.Item label={inputParam.label || key} name={key}>
          <Input />
        </Form.Item>
      );
    case InputTypes.INPUTNUMBER:
      return (
        <Form.Item label={inputParam.label || key} name={key}>
          <InputNumber />
        </Form.Item>
      );
    case InputTypes.SWITCH:
      return (
        <Form.Item label={inputParam.label || key} name={key} valuePropName="checked">
          <Switch />
        </Form.Item>
      );
    case InputTypes.SELECT:
      return (
        <Form.Item label={inputParam.label || key} name={key}>
          <Select>
            {inputParam.options?.map((option, index) => (
              <Select.Option key={index} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      );
    default:
      return null;
  }
};

export default function QueryPropoerties() {
  const { token } = theme.useToken();
  const { reportErrorFromException } = useActivity();
  const [graphs, setGraphs] = useState<ISelectProp[]>([]);
  const [isAnalysing, setIsAnalysing] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<GraphAnalyzer>();

  const getGraphsData = async () => {
    try{
    const res = await getGraphList();
    if(res.data){
      const filteredData: ISelectProp[] = res.data.map((graph: any) => {
         return {
          value: graph.idgraph,
          label: graph.name
        }
      })
      setGraphs(filteredData);
    }
    }catch(err){
      message.error("Failed to fetch the list of graphs");
      reportErrorFromException(
        "Query Interface",
        err,
        "Failed to fetch the list of graphs."
      );
    }
  }

  useEffect(() => {
    getGraphsData();
  }, [])

  const listStyle: React.CSSProperties = {
    lineHeight: '200px',
    textAlign: 'center',
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    marginTop: 16,
  };
  
  type FieldType = {
    graph_id?: string;
    method?: string;
  };

  const runAnalysis = async (values: any) => {
    const result = await analyzeGraph(values);
    if (result.data) {
      message.success("Analysis completed successfully");
    } else {
      message.error("Error in graph analysis: " + result.message);
      reportErrorFromException(
        "Query Interface",
        result.message,
        "Failed to analyze the graph."
      );
    }
    setIsAnalysing(false);
  }
  
  const onValueChange = (param: any) => {
    if (param && param.method) {
      const tool = Analyzers.find((tool) => tool.name == param.method || tool.id == param.method)
      setSelectedTool(tool);
    }
  }

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setIsAnalysing(true);
    await runAnalysis(values);
  };

  return (
    <>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        onFinish={onFinish}
        size={"large"}
        style={{ maxWidth: 600, marginTop: "20px" }}
        onValuesChange={onValueChange}
      >
        <Form.Item<FieldType> label="Graph" name="graph_id" rules={[{ required: true, message: 'Please select a graph' }]}>
          <Select>
            {graphs.map((option, index) => (
              <Select.Option key={index} value={option.value}>
                {`${option.value} | ${option.label}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item<FieldType> label="Analysis" name="method"
          rules={[{ required: true, message: 'Please select type of analysis' }]}>
          <Select>
            {Analyzers.map((option, index) => (
              <Select.Option key={index} value={option.id}>
                {option.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {selectedTool && Object.keys(selectedTool.inputParameters).map((key) => (
          <div key={key}>
            {renderInputField(key, selectedTool.inputParameters[key])}
          </div>
        ))}
        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <Button type="primary" htmlType="submit" style={{minWidth: "150px"}}>
            Run
          </Button>
      </Form.Item>

      </Form>
      {isAnalysing && (
      <Box sx={{ width: '100%', display: "flex", flexDirection: "column"}}>
        <LinearProgress />
        <Button color="danger" type="primary">
          Cancel
        </Button>
      </Box>
      )}
      <div style={listStyle}>Result</div>
    </>
  );
}
