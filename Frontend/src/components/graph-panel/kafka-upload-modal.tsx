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
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Divider, Form, Input, Modal, Radio, Select, message } from 'antd';
import { getGraphList, startKafkaStream, KafkaStreamRequest } from '@/services/graph-service';
import { IGraphDetails } from '@/types/graph-types';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onStreamStarted?: (payload: { graphId?: string; topicName: string }) => void;
}

const KafkaUploadModal = ({ open, setOpen, onStreamStarted }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [graphs, setGraphs] = useState<{ value: string; label: string }[]>([]);
  const [graphsData, setGraphsData] = useState<IGraphDetails[]>([]);
  const [selectedGraphDetails, setSelectedGraphDetails] = useState<IGraphDetails | null>(null);

  const isExistingGraph = Form.useWatch('isExistingGraph', form);
  const useDefaultGraphId = Form.useWatch('useDefaultGraphId', form);
  const useDefaultKafka = Form.useWatch('useDefaultKafka', form);
  const selectedGraphId = Form.useWatch('graphId', form);

  useEffect(() => {
    if (!open) return;
    getGraphList()
      .then((res) => {
        setGraphsData(res.data);
        const options = res.data.map((graph) => ({
          value: String(graph.idgraph),
          label: `${graph.name} (ID: ${graph.idgraph})`,
        }));
        setGraphs(options);
      })
      .catch(() => {
        message.error('Failed to load graph list');
      });
  }, [open]);

  useEffect(() => {
    if (isExistingGraph && selectedGraphId) {
      const graphDetails = graphsData.find(g => String(g.idgraph) === String(selectedGraphId));
      setSelectedGraphDetails(graphDetails || null);
    } else {
      setSelectedGraphDetails(null);
    }
  }, [selectedGraphId, isExistingGraph, graphsData]);

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: KafkaStreamRequest = {
        isExistingGraph: values.isExistingGraph,
        graphId: values.isExistingGraph
          ? values.graphId
          : values.useDefaultGraphId
            ? undefined
            : values.graphId,
        useDefaultGraphId: values.useDefaultGraphId,
        partitionAlgorithm: values.isExistingGraph ? undefined : values.partitionAlgorithm,
        isDirected: values.isExistingGraph ? undefined : values.isDirected === 'directed',
        useDefaultKafka: values.useDefaultKafka,
        kafkaConfigPath: values.useDefaultKafka ? undefined : values.kafkaConfigPath,
        topicName: values.topicName,
      };

      setLoading(true);
      await startKafkaStream(payload);
      message.success('Kafka streaming started');
      localStorage.setItem(
        'kafkaStreamStatus',
        JSON.stringify({
          connected: true,
          graphId: payload.graphId || '',
          topicName: payload.topicName,
          updatedAt: new Date().toISOString(),
        })
      );
      onStreamStarted?.({
        graphId: payload.graphId,
        topicName: payload.topicName,
      });
      setOpen(false);
    } catch (err) {
      message.error('Failed to start Kafka streaming');
    } finally {
      setLoading(false);
    }
  };

  const partitionOptions = useMemo(
    () => [
      { value: '1', label: 'Hash partitioning' },
      { value: '2', label: 'Fennel partitioning' },
      { value: '3', label: 'LDG partitioning' },
    ],
    []
  );

  return (
    <Modal title="Apache Kafka" open={open} onCancel={handleCancel} footer={null}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isExistingGraph: false,
          useDefaultGraphId: true,
          partitionAlgorithm: '1',
          isDirected: 'directed',
          useDefaultKafka: true,
        }}
      >
        <Divider orientation="left">Graph Setup</Divider>
        <Form.Item label="Stream Into Existing Graph" name="isExistingGraph">
          <Radio.Group>
            <Radio value={true}>Existing Graph</Radio>
            <Radio value={false}>New Graph</Radio>
          </Radio.Group>
        </Form.Item>

        {isExistingGraph ? (
          <>
            <Form.Item
              label="Graph ID"
              name="graphId"
              rules={[{ required: true, message: 'Select a graph' }]}
            >
              <Select options={graphs} placeholder="Select graph" />
            </Form.Item>
            {selectedGraphDetails && (
              <>
                <Form.Item label="Partition Algorithm">
                  <Input
                    value={
                      selectedGraphDetails.id_algorithm === '1' || selectedGraphDetails.id_algorithm === 1
                        ? 'Hash partitioning'
                        : selectedGraphDetails.id_algorithm === '2' || selectedGraphDetails.id_algorithm === 2
                        ? 'Fennel partitioning'
                        : selectedGraphDetails.id_algorithm === '3' || selectedGraphDetails.id_algorithm === 3
                        ? 'LDG partitioning'
                        : 'Unknown'
                    }
                    disabled
                  />
                </Form.Item>
                <Form.Item label="Graph Type">
                  <Input
                    value={
                      selectedGraphDetails.is_directed === 'true' || selectedGraphDetails.is_directed === '1'
                        ? 'Directed'
                        : 'Undirected'
                    }
                    disabled
                  />
                </Form.Item>
              </>
            )}
          </>
        ) : (
          <>
            <Form.Item label="Use Default Graph ID" name="useDefaultGraphId">
              <Radio.Group>
                <Radio value={true}>Yes</Radio>
                <Radio value={false}>No</Radio>
              </Radio.Group>
            </Form.Item>
            {!useDefaultGraphId && (
              <Form.Item
                label="Custom Graph ID"
                name="graphId"
                rules={[{ required: true, message: 'Enter a graph ID' }]}
              >
                <Input placeholder="e.g. 5" />
              </Form.Item>
            )}
            <Form.Item
              label="Partitioning Algorithm"
              name="partitionAlgorithm"
              rules={[{ required: true, message: 'Select partitioning algorithm' }]}
            >
              <Select options={partitionOptions} />
            </Form.Item>
            <Form.Item label="Graph Type" name="isDirected">
              <Radio.Group>
                <Radio value="directed">Directed</Radio>
                <Radio value="undirected">Undirected</Radio>
              </Radio.Group>
            </Form.Item>
          </>
        )}

        <Divider orientation="left">Kafka Setup</Divider>
        <Form.Item label="Use Default Kafka Configuration" name="useDefaultKafka">
          <Radio.Group>
            <Radio value={true}>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </Form.Item>

        {useDefaultKafka ? (
          <>
            <Form.Item label="Kafka Broker">
              <Input value="Loaded from server config" disabled />
            </Form.Item>
            <Form.Item label="Consumer Group ID">
              <Input value="Default (graph-stream-consumer)" disabled />
            </Form.Item>
            <Form.Item label="Offset Reset">
              <Input value="earliest" disabled />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            label="Kafka Config File Path (server-side)"
            name="kafkaConfigPath"
            rules={[{ required: true, message: 'Enter config file path' }]}
          >
            <Input placeholder="/path/to/kafka-config.properties" />
          </Form.Item>
        )}

        <Divider orientation="left">Topic</Divider>
        <Form.Item
          label="Kafka Topic Name"
          name="topicName"
          rules={[{ required: true, message: 'Enter a topic name' }]}
        >
          <Input placeholder="graph-topic" />
        </Form.Item>

        <Button type="primary" onClick={handleSubmit} loading={loading} block>
          Start Streaming
        </Button>
      </Form>
    </Modal>
  );
};

export default KafkaUploadModal;
