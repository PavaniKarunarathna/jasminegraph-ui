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
import { Alert, Button, Descriptions, Divider, Form, Input, Modal, Radio, Select, Space, Tag, message } from 'antd';
import {
  startKafkaStream,
  KafkaStreamRequest,
  saveKafkaStreamConfig,
} from '@/services/graph-service';
import { IGraphDetails, IKafkaStreamStatus } from '@/types/graph-types';
import axios from 'axios';

const DEFAULT_KAFKA_LABEL = 'Default from server config';
const KAFKA_STATUS_STORAGE_KEY = 'kafkaStreamStatus';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onStreamStarted?: (payload: IKafkaStreamStatus) => void;
  graphs?: IGraphDetails[];
  kafkaDefaults?: {
    broker: string;
    groupId: string;
    offsetReset: string;
  };
  kafkaTopics?: string[];
  dataLoading?: boolean;
}

const KafkaUploadModal = ({ 
  open, 
  setOpen, 
  onStreamStarted, 
  graphs: graphsProp = [], 
  kafkaDefaults: kafkaDefaultsProp,
  kafkaTopics: kafkaTopicsProp = [],
  dataLoading = false 
}: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'configure' | 'confirm'>('configure');
  const [pendingStatus, setPendingStatus] = useState<IKafkaStreamStatus | null>(null);
  const topicOptions = useMemo(
    () => kafkaTopicsProp.map((topic) => ({ value: topic, label: topic })),
    [kafkaTopicsProp]
  );
  
  // Use props for graphs data
  const graphsData = graphsProp;
  const graphs = useMemo(() => 
    graphsData.map((graph) => ({
      value: String(graph.idgraph),
      label: `${graph.name} (ID: ${graph.idgraph})`,
    })), 
    [graphsData]
  );
  
  const [selectedGraphDetails, setSelectedGraphDetails] = useState<IGraphDetails | null>(null);
  
  // Use props for kafka defaults, with fallback
  const kafkaDefaults = kafkaDefaultsProp || {
    broker: DEFAULT_KAFKA_LABEL,
    groupId: DEFAULT_KAFKA_LABEL,
    offsetReset: 'earliest',
  };

  const isExistingGraph = Form.useWatch('isExistingGraph', form);
  const useDefaultGraphId = Form.useWatch('useDefaultGraphId', form);
  const useDefaultKafka = Form.useWatch('useDefaultKafka', form);
  const selectedGraphId = Form.useWatch('graphId', form);

  const partitionOptions = useMemo(
    () => [
      { value: '1', label: 'Hash partitioning' },
      { value: '2', label: 'Fennel partitioning' },
      { value: '3', label: 'LDG partitioning' },
    ],
    []
  );

  const resetModalState = () => {
    form.resetFields();
    setStep('configure');
    setPendingStatus(null);
    setSelectedGraphDetails(null);
  };

  const getPartitionLabel = (value?: string | number) => {
    if (value === undefined || value === null || value === '') {
      return 'Unknown';
    }
    
    const normalized = String(value).toLowerCase().trim();
    
    // Try exact match first
    const exactMatch = partitionOptions.find((option) => option.value === normalized);
    if (exactMatch) return exactMatch.label;
    
    // Try partial matches for common algorithm names
    if (normalized.includes('hash') || normalized === '1') {
      return 'Hash partitioning';
    }
    if (normalized.includes('fennel') || normalized === '2') {
      return 'Fennel partitioning';
    }
    if (normalized.includes('ldg') || normalized === '3') {
      return 'LDG partitioning';
    }
    
    // If it's a number, try to map it
    const numValue = parseInt(normalized);
    if (!isNaN(numValue)) {
      const option = partitionOptions.find((option) => option.value === String(numValue));
      if (option) return option.label;
    }
    
    return 'Unknown';
  };

  const getGraphTypeLabel = (value?: string | boolean | number) => (
    value === true ||
    value === 1 ||
    value === 'true' ||
    value === '1' ||
    value === 'directed'
      ? 'Directed'
      : 'Undirected'
  );

  const buildStreamStatus = (values: any): IKafkaStreamStatus => {
    const normalizedTopicName = String(values.topicName ?? '').trim();
    const normalizedGraphId = values.graphId === undefined || values.graphId === null
      ? undefined
      : String(values.graphId).trim();
    const normalizedKafkaConfigPath = values.kafkaConfigPath === undefined || values.kafkaConfigPath === null
      ? undefined
      : String(values.kafkaConfigPath).trim();
    const selectedGraph = graphsData.find((graph) => String(graph.idgraph) === normalizedGraphId);
    const isDirected = values.isExistingGraph
      ? getGraphTypeLabel(selectedGraph?.is_directed) === 'Directed'
      : values.isDirected === 'directed';

    return {
      connected: false,
      topicName: normalizedTopicName,
      graphId: values.isExistingGraph
        ? normalizedGraphId
        : values.useDefaultGraphId
          ? undefined
          : normalizedGraphId,
      streamStatus: 'active',
      graphName: values.isExistingGraph ? selectedGraph?.name : undefined,
      isExistingGraph: Boolean(values.isExistingGraph),
      useDefaultGraphId: values.isExistingGraph ? Boolean(values.useDefaultGraphId) : true,
      partitionAlgorithm: values.isExistingGraph
        ? selectedGraph?.id_algorithm === undefined || selectedGraph?.id_algorithm === null
          ? undefined
          : String(selectedGraph.id_algorithm)
        : values.partitionAlgorithm,
      partitionAlgorithmLabel: values.isExistingGraph
        ? getPartitionLabel(selectedGraph?.id_algorithm)
        : getPartitionLabel(values.partitionAlgorithm),
      isDirected,
      graphTypeLabel: values.isExistingGraph
        ? getGraphTypeLabel(selectedGraph?.is_directed)
        : values.isDirected === 'directed'
          ? 'Directed'
          : 'Undirected',
      useDefaultKafka: Boolean(values.useDefaultKafka),
      kafkaConfigPath: values.useDefaultKafka ? undefined : normalizedKafkaConfigPath,
      kafkaBroker: values.useDefaultKafka ? kafkaDefaults.broker : undefined,
      groupId: values.useDefaultKafka ? kafkaDefaults.groupId : undefined,
      offsetReset: values.useDefaultKafka ? kafkaDefaults.offsetReset : undefined,
    };
  };

  useEffect(() => {
    if (!open) return;
    resetModalState();
  }, [open]);

  useEffect(() => {
    if (isExistingGraph && selectedGraphId) {
      const graphDetails = graphsData.find(g => String(g.idgraph) === String(selectedGraphId));
      setSelectedGraphDetails(graphDetails || null);
    } else {
      setSelectedGraphDetails(null);
    }
  }, [selectedGraphId, isExistingGraph, graphsData]);

  // Clear direction selection when switching to existing graph mode
  useEffect(() => {
    if (isExistingGraph) {
      form.setFieldsValue({ isDirected: undefined });
    }
  }, [isExistingGraph, form]);

  // Set useDefaultGraphId for new graphs
  useEffect(() => {
    if (!isExistingGraph) {
      form.setFieldsValue({ useDefaultGraphId: true });
    }
  }, [isExistingGraph, form]);

  const handleCancel = () => {
    resetModalState();
    setOpen(false);
  };

  const handleReview = async () => {
    try {
      const values = await form.validateFields();
      setPendingStatus(buildStreamStatus(values));
      setStep('confirm');
    } catch (err) {
      return err;
    }
  };

  const handleSubmit = async () => {
    try {
      const streamStatus = pendingStatus ?? buildStreamStatus(await form.validateFields());
      const payload: KafkaStreamRequest = {
        isExistingGraph: streamStatus.isExistingGraph,
        graphId: streamStatus.graphId,
        useDefaultGraphId: streamStatus.isExistingGraph ? undefined : streamStatus.useDefaultGraphId,
        partitionAlgorithm: streamStatus.isExistingGraph ? undefined : streamStatus.partitionAlgorithm,
        isDirected: streamStatus.isExistingGraph ? undefined : streamStatus.isDirected,
        useDefaultKafka: streamStatus.useDefaultKafka,
        kafkaConfigPath: streamStatus.useDefaultKafka ? undefined : streamStatus.kafkaConfigPath,
        topicName: streamStatus.topicName,
      };

      setLoading(true);
      const response = await startKafkaStream(payload);
      const resolvedGraphId = response?.data?.graphId || streamStatus.graphId;
      const configResponse = await saveKafkaStreamConfig({
        topicName: streamStatus.topicName,
        graphId: resolvedGraphId,
        isExistingGraph: streamStatus.isExistingGraph,
        useDefaultGraphId: streamStatus.isExistingGraph ? undefined : streamStatus.useDefaultGraphId,
        partitionAlgorithm: streamStatus.isExistingGraph ? undefined : streamStatus.partitionAlgorithm,
        partitionAlgorithmLabel: streamStatus.partitionAlgorithmLabel,
        isDirected: streamStatus.isExistingGraph ? undefined : streamStatus.isDirected,
        graphTypeLabel: streamStatus.graphTypeLabel,
        useDefaultKafka: streamStatus.useDefaultKafka,
        kafkaConfigPath: streamStatus.useDefaultKafka ? undefined : streamStatus.kafkaConfigPath,
        kafkaBroker: streamStatus.useDefaultKafka ? streamStatus.kafkaBroker : undefined,
        groupId: streamStatus.useDefaultKafka ? streamStatus.groupId : undefined,
        offsetReset: streamStatus.useDefaultKafka ? streamStatus.offsetReset : undefined,
      });
      const resolvedStatus: IKafkaStreamStatus = {
        ...streamStatus,
        connected: true,
        streamStatus: configResponse?.data?.stream_status || 'active',
        graphId: resolvedGraphId,
        dbId: configResponse?.data?.id,
        updatedAt: new Date().toISOString(),
      };

      message.success('Kafka streaming started successfully. Redirecting to Extract tab');
      localStorage.setItem(
        KAFKA_STATUS_STORAGE_KEY,
        JSON.stringify(resolvedStatus)
      );
      handleCancel();
      onStreamStarted?.(resolvedStatus);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to start Kafka streaming'
        : 'Failed to start Kafka streaming';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={step === 'configure' ? 'Apache Kafka Configuration' : 'Confirm Kafka Streaming'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      {step === 'configure' ? (
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
            </>
          ) : (
            <>
              <Form.Item name="useDefaultGraphId" hidden>
                <Input />
              </Form.Item>
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
                <Input value={kafkaDefaults.broker} disabled />
              </Form.Item>
              <Form.Item label="Consumer Group ID">
                <Input value={kafkaDefaults.groupId} disabled />
              </Form.Item>
              <Form.Item label="Offset Reset">
                <Input value={kafkaDefaults.offsetReset} disabled />
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
            rules={[
              { required: true, message: 'Enter a topic name' },
              { validator: (_, value) => String(value ?? '').trim() ? Promise.resolve() : Promise.reject(new Error('Enter a topic name')) }
            ]}
          >
            <Select
              showSearch
              options={topicOptions}
              loading={dataLoading}
              placeholder={dataLoading ? 'Loading Kafka topics...' : 'Search or select Kafka topic'}
              filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              notFoundContent={dataLoading ? 'Loading topics...' : 'No matching topics'}
            />
          </Form.Item>

          <Button type="primary" onClick={handleReview} block>
            Review Configuration
          </Button>
        </Form>
      ) : pendingStatus ? (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Review the selected Kafka streaming settings before starting the stream."
          />
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Graph Mode">
              <Tag color={pendingStatus.isExistingGraph ? 'blue' : 'green'}>
                {pendingStatus.isExistingGraph ? 'Existing Graph' : 'New Graph'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Graph ID">
              {pendingStatus.graphId || 'Server default graph ID'}
            </Descriptions.Item>
            <Descriptions.Item label="Graph Name">
              {pendingStatus.graphName || 'New graph will be created'}
            </Descriptions.Item>
            <Descriptions.Item label="Partition Algorithm">
              {pendingStatus.partitionAlgorithmLabel || 'Not applicable'}
            </Descriptions.Item>
            <Descriptions.Item label="Graph Type">
              {pendingStatus.graphTypeLabel || 'Not applicable'}
            </Descriptions.Item>
            <Descriptions.Item label="Kafka Configuration">
              <Tag color={pendingStatus.useDefaultKafka ? 'gold' : 'purple'}>
                {pendingStatus.useDefaultKafka ? 'Server Default' : 'Custom Config File'}
              </Tag>
            </Descriptions.Item>
            {pendingStatus.useDefaultKafka ? (
              <>
                <Descriptions.Item label="Kafka Broker">{pendingStatus.kafkaBroker || DEFAULT_KAFKA_LABEL}</Descriptions.Item>
                <Descriptions.Item label="Consumer Group ID">{pendingStatus.groupId || DEFAULT_KAFKA_LABEL}</Descriptions.Item>
                <Descriptions.Item label="Offset Reset">{pendingStatus.offsetReset || 'earliest'}</Descriptions.Item>
              </>
            ) : (
              <Descriptions.Item label="Kafka Config Path">{pendingStatus.kafkaConfigPath}</Descriptions.Item>
            )}
            <Descriptions.Item label="Kafka Topic">{pendingStatus.topicName}</Descriptions.Item>
          </Descriptions>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setStep('configure')}>Back</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              Start Streaming
            </Button>
          </Space>
        </Space>
      ) : null}
    </Modal>
  );
};

export default KafkaUploadModal;
