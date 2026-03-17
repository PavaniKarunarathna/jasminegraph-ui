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
import { getGraphList, startKafkaStream, KafkaStreamRequest, getGraphClusterProperties } from '@/services/graph-service';
import { IGraphDetails, IKafkaStreamStatus } from '@/types/graph-types';
import axios from 'axios';

const DEFAULT_KAFKA_LABEL = 'Default from server config';
const KAFKA_STATUS_STORAGE_KEY = 'kafkaStreamStatus';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onStreamStarted?: (payload: IKafkaStreamStatus) => void;
}

const KafkaUploadModal = ({ open, setOpen, onStreamStarted }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'configure' | 'confirm'>('configure');
  const [pendingStatus, setPendingStatus] = useState<IKafkaStreamStatus | null>(null);
  const [graphs, setGraphs] = useState<{ value: string; label: string }[]>([]);
  const [graphsData, setGraphsData] = useState<IGraphDetails[]>([]);
  const [selectedGraphDetails, setSelectedGraphDetails] = useState<IGraphDetails | null>(null);
  const [kafkaDefaults, setKafkaDefaults] = useState({
    broker: DEFAULT_KAFKA_LABEL,
    groupId: DEFAULT_KAFKA_LABEL,
    offsetReset: 'earliest',
  });

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
    const normalized = value === undefined || value === null ? '' : String(value);
    return partitionOptions.find((option) => option.value === normalized)?.label || 'Unknown';
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
      graphName: values.isExistingGraph ? selectedGraph?.name : undefined,
      isExistingGraph: Boolean(values.isExistingGraph),
      useDefaultGraphId: Boolean(values.useDefaultGraphId),
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

    const getStringByKeys = (source: Record<string, unknown>, keys: string[]) => {
      for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
      return undefined;
    };

    Promise.all([getGraphList(), getGraphClusterProperties()])
      .then(([graphRes, propertyRes]) => {
        setGraphsData(graphRes.data);
        const options = graphRes.data.map((graph) => ({
          value: String(graph.idgraph),
          label: `${graph.name} (ID: ${graph.idgraph})`,
        }));
        setGraphs(options);

        const properties = (propertyRes?.data ?? {}) as Record<string, unknown>;
        const broker = getStringByKeys(properties, [
          'org.jasminegraph.server.streaming.kafka.host',
          'kafka.host',
          'metadata.broker.list',
          'kafkaBroker',
          'broker',
        ]);
        const groupId = getStringByKeys(properties, [
          'org.jasminegraph.server.streaming.kafka.group.id',
          'kafka.group.id',
          'group.id',
          'groupId',
        ]);
        const offsetReset = getStringByKeys(properties, [
          'org.jasminegraph.server.streaming.kafka.auto.offset.reset',
          'auto.offset.reset',
          'offsetReset',
        ]);

        setKafkaDefaults({
          broker: broker || DEFAULT_KAFKA_LABEL,
          groupId: groupId || DEFAULT_KAFKA_LABEL,
          offsetReset: offsetReset || 'earliest',
        });
      })
      .catch(() => {
        message.error('Failed to load graph list and Kafka defaults');
        setKafkaDefaults({
          broker: DEFAULT_KAFKA_LABEL,
          groupId: DEFAULT_KAFKA_LABEL,
          offsetReset: 'earliest',
        });
      });
  }, [form, open]);

  useEffect(() => {
    if (isExistingGraph && selectedGraphId) {
      const graphDetails = graphsData.find(g => String(g.idgraph) === String(selectedGraphId));
      setSelectedGraphDetails(graphDetails || null);
    } else {
      setSelectedGraphDetails(null);
    }
  }, [selectedGraphId, isExistingGraph, graphsData]);

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
      const values = await form.validateFields();
      const streamStatus = buildStreamStatus(values);
      const payload: KafkaStreamRequest = {
        isExistingGraph: streamStatus.isExistingGraph,
        graphId: streamStatus.graphId,
        useDefaultGraphId: streamStatus.useDefaultGraphId,
        partitionAlgorithm: streamStatus.isExistingGraph ? undefined : streamStatus.partitionAlgorithm,
        isDirected: streamStatus.isExistingGraph ? undefined : streamStatus.isDirected,
        useDefaultKafka: streamStatus.useDefaultKafka,
        kafkaConfigPath: streamStatus.useDefaultKafka ? undefined : streamStatus.kafkaConfigPath,
        topicName: streamStatus.topicName,
      };

      setLoading(true);
      const response = await startKafkaStream(payload);
      const resolvedGraphId = response?.data?.graphId || streamStatus.graphId;
      const resolvedStatus: IKafkaStreamStatus = {
        ...streamStatus,
        connected: true,
        graphId: resolvedGraphId,
        updatedAt: new Date().toISOString(),
      };

      message.success('Kafka streaming started');
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
              {selectedGraphDetails && (
                <>
                  <Form.Item label="Partition Algorithm">
                    <Input value={getPartitionLabel(selectedGraphDetails.id_algorithm)} disabled />
                  </Form.Item>
                  <Form.Item label="Graph Type">
                    <Input value={getGraphTypeLabel(selectedGraphDetails.is_directed)} disabled />
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
                  rules={[
                    { required: true, message: 'Enter a graph ID' },
                    { pattern: /^\d+$/, message: 'Graph ID must be numeric' },
                  ]}
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
            <Input placeholder="graph-topic" />
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
