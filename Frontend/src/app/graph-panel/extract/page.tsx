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
import SegmentedProgress from "@/components/extract-panel/progress-bar";
import React, {useEffect, useState} from "react";
import {InboxOutlined, LoadingOutlined} from "@ant-design/icons";
import type { RcFile } from "antd/es/upload/interface";
import {Button, Col, Descriptions, Divider, message, Row, Typography, Upload, Modal, Input, Card, Spin, Tag} from "antd";
import Image from "next/image";
import HadoopExtractModal from "@/components/extract-panel/hadoop-extract-modal";
import {useAppDispatch, useAppSelector} from "@/redux/hook";
import {add_upload_bytes} from "@/redux/features/queryData";
import useWebSocket, {ReadyState} from "react-use-websocket";
import axios from "axios";
import { useActivity } from "@/hooks/useActivity";
import {
    deleteGraph,
    getKGConstructionMetaData,
    getOnProgressKGConstructionMetaData,
    stopConstructKG,
    stopKafkaStream,
    startKafkaStream,
    KafkaStreamRequest,
    loadKafkaStreamConfigs,
    updateKafkaStreamConfigStatus,
} from "@/services/graph-service";
import HadoopKgForm from "@/components/extract-panel/hadoop-kg-form";
import {LRUCache} from "lru-cache";
import Status = LRUCache.Status;
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import {IKafkaStreamStatus, IKnowledgeGraph} from "@/types/graph-types";
import KgForm from "@/components/extract-panel/kg-form";

const { Dragger } = Upload;
const { Search } = Input;
const { Title, Text } = Typography;

const WS_URL = "ws://localhost:8080";
const HADOOP_LOGO_SRC = "/assets/images/hadoop-logo.jpg";

interface IUploadBytes {
    graphId: string;
    name:string;
    uploaded: number;
    total: number;
    percentage: number;
    triplesPerSecond?: number;
    bytesPerSecond: number;
    startTime: string;
    uploadPath: string;
    llmRunnerString:string;
    inferenceEngine:string;
    model:string;
    chunkSize:string;
    kgConstructionStatus:string;
    hdfsIp:string;
    hdfsPort:string;

}

type ISocketResponse = {
    type: string,
    clientId?: string
}

const KAFKA_STATUS_STORAGE_KEY = "kafkaStreamStatus";

export default function GraphUpload() {
    const { reportError, reportErrorFromException } = useActivity();
    const dispatch = useAppDispatch();
    const uploadBytesGraphs  = useAppSelector((state) => state.queryData.uploadBytes);

    const [hadoopModalOpen, setHadoopModelOpen] = useState<boolean>(false);
    const [file, setFile] = useState<File>();
    const [fileUrl, setFileUrl] = useState<string>();
    const [modalOpen, setModalOpen] = useState(false);
    const [isLocalFileUpload, setIsLocalFileUpload] = useState<boolean>(false);
    const [showUploadSection, setShowUploadSection] = useState<boolean>(false);
    const [graphs, setGraphs] = useState<IKnowledgeGraph[]>([]);
    const [initForm, setInitForm] = useState<IKnowledgeGraph>();
    const [loading, setLoading] = useState<boolean>(false);
    const [clientId, setClientID] = useState<string>('');
    const [showMeta, setShowMeta] = useState<string>("");
    const [pausedGraphs, setPausedGraphs] = useState<Record<string, boolean>>({});
    const [kafkaStatuses, setKafkaStatuses] = useState<IKafkaStreamStatus[]>([]);
    const [kafkaPauseLoadingByKey, setKafkaPauseLoadingByKey] = useState<Record<string, boolean>>({});
    const [kafkaTerminateLoadingByKey, setKafkaTerminateLoadingByKey] = useState<Record<string, boolean>>({});
    const [kafkaStartLoadingByKey, setKafkaStartLoadingByKey] = useState<Record<string, boolean>>({});
    const [terminateConfirmModal, setTerminateConfirmModal] = useState<IKafkaStreamStatus | null>(null);
    const [showKafkaDetails, setShowKafkaDetails] = useState<boolean[]>([]);
    const [tpsHistory, setTpsHistory] = useState<Record<string, number[]>>({});

    const getKafkaStatusKey = (status: IKafkaStreamStatus): string => {
        const topicKey = String(status.topicName || '').trim();
        if (topicKey.length > 0) {
            return topicKey;
        }
        const dbKey = String(status.dbId || '').trim();
        if (dbKey.length > 0) {
            return dbKey;
        }
        return String(status.graphId || 'unknown');
    };

    const normalizeStreamStatus = (value: unknown): string => String(value ?? '').trim().toLowerCase();

    const getAverageTPS = (graphId: string) => {
        const history = tpsHistory[graphId] || [];
        if (history.length === 0) return 0;

        const sum = history.reduce((acc, val) => acc + val, 0);
        return sum / history.length;
    };
    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, { share: true, shouldReconnect: (closeEvent) => true });

    const formatSize = (bytes : number) => {
        if (bytes < 1024) return `${bytes.toFixed(0)} Bytes`;
        else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        else if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        else return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const handleFileUpload = (file: RcFile) => {
        setModalOpen(true);
        setFile(file);

        if (fileUrl) URL.revokeObjectURL(fileUrl);

        if (file) setFileUrl(URL.createObjectURL(file));
        else setFileUrl(undefined);

        return false;
    };



    const pauseKGConstruction = async (graphId: string) => {
        try {
            setLoading(true);
            stopConstructKG(graphId, "paused").then(()=>{

                getKGConstructionMetaData(graphId).then(kgConstructMeta=>{
                    setInitForm(kgConstructMeta.data[0]);
                    setHadoopModelOpen(true);
                    message.success("Graph construction paused");
                    setPausedGraphs((prev) => ({ ...prev, [graphId]: true }));
                })
            })
        } catch (error) {
            message.error("Failed to pause graph construction");
            reportErrorFromException(
                "Graph Panel",
                error,
                "Unable to pause the graph construction process."
            );
        }finally {
            setLoading(false);
        }
    };

    const stopKGConstruction = async (graphId: string) => {
        try {  setLoading(true);
            stopConstructKG(graphId, "stopped").then(res=>{
                deleteGraph(graphId).then(()=>{
                    message.success("Graph construction stopped");
                    setLoading(false);
                })
            })
        } catch (error) {
            message.error("Failed to stop graph construction");
            reportErrorFromException(
                "Graph Panel",
                error,
                "Unable to stop the graph construction process."
            );
        }
    };

    useEffect(() => {
        const message = lastJsonMessage as ISocketResponse;
        if(!message) return;
        if(message?.type === "CONNECTED"){

            setClientID(message?.clientId || '');
        } else {
            dispatch(add_upload_bytes({ ...message }));

            setLoading(false);
        }
    }, [lastJsonMessage]);

    useEffect(() => {
        uploadBytesGraphs?.updates?.forEach((upload) => {
            if (upload.triplesPerSecond !== undefined) {
                setTpsHistory(prev => ({
                    ...prev,
                    [upload.graphId]: [
                        ...(prev[upload.graphId] || []),
                        upload.triplesPerSecond
                    ]
                }));
            }
        });
    }, [uploadBytesGraphs]);


    const hasActiveUploads = uploadBytesGraphs?.updates?.length > 0;

    useEffect(() => {
        if (hadoopModalOpen || showUploadSection || !hasActiveUploads) return;
        if (readyState !== ReadyState.OPEN) return;

        setLoading(true);
        const interval = setInterval(() => {
            if (readyState === ReadyState.OPEN) {
                sendJsonMessage({
                    type: "UPBYTES",
                    graphIds : [],
                    clientId: clientId,
                    clusterId: localStorage.getItem("selectedCluster")
                });
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [clientId, readyState, showUploadSection, hadoopModalOpen, hasActiveUploads]);

    useEffect(() => {
        const normalizeLocalStatus = (item: any): IKafkaStreamStatus => ({
            ...item,
            streamStatus: normalizeStreamStatus(item?.streamStatus) as IKafkaStreamStatus['streamStatus'] ||
                (item?.connected ? "active" : "paused"),
        });

        const mapDbStatus = (item: any): IKafkaStreamStatus => ({
            connected: normalizeStreamStatus(item.stream_status) === "active",
            streamStatus: normalizeStreamStatus(item.stream_status) as IKafkaStreamStatus['streamStatus'],
            dbId: item.id,
            topicName: item.topic_name,
            graphId: item.graph_id || undefined,
            isExistingGraph: item.is_existing_graph,
            useDefaultGraphId: item.use_default_graph_id,
            partitionAlgorithm: item.partition_algorithm || undefined,
            partitionAlgorithmLabel: item.partition_algorithm_label || "",
            isDirected: Boolean(item.is_directed),
            graphTypeLabel: item.graph_type_label || "",
            useDefaultKafka: item.use_default_kafka,
            kafkaConfigPath: item.kafka_config_path || undefined,
            kafkaBroker: item.kafka_broker || undefined,
            groupId: item.group_id || undefined,
            offsetReset: item.offset_reset || undefined,
            updatedAt: item.updated_at,
        });

        const loadKafkaStatuses = async () => {
            const raw = localStorage.getItem(KAFKA_STATUS_STORAGE_KEY);
            let localStatuses: IKafkaStreamStatus[] = [];
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
                    localStatuses = arr.map(normalizeLocalStatus);
                } catch {
                    localStatuses = [];
                }
            }

            try {
                const result = await loadKafkaStreamConfigs();
                const dbStatuses = (result?.data || []).map(mapDbStatus);
                if (dbStatuses.length > 0) {
                    setKafkaStatuses(dbStatuses);
                    localStorage.setItem(KAFKA_STATUS_STORAGE_KEY, JSON.stringify(dbStatuses));
                    return;
                }
            } catch {
                // Fall back to local cache when backend data cannot be fetched.
            }

            setKafkaStatuses(localStatuses);
        };

        void loadKafkaStatuses();
        const onStorage = (event: StorageEvent) => {
            if (event.key === KAFKA_STATUS_STORAGE_KEY) {
                void loadKafkaStatuses();
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        setShowKafkaDetails(new Array(kafkaStatuses.length).fill(false));
    }, [kafkaStatuses.length]);

        const handlePauseKafkaStream = async (status: IKafkaStreamStatus) => {
            const statusKey = getKafkaStatusKey(status);
            try {
                setKafkaPauseLoadingByKey((prev) => ({ ...prev, [statusKey]: true }));
                const response = await stopKafkaStream(status.topicName);
                message.success(response.data?.message || "Kafka streaming paused successfully");
                if (status.dbId) {
                    await updateKafkaStreamConfigStatus(status.dbId, 'paused');
                }
                const updatedStatuses = kafkaStatuses.map(s =>
                    s.topicName === status.topicName
                        ? { ...s, connected: false, streamStatus: 'paused' as const, updatedAt: new Date().toISOString() }
                        : s
                );
                localStorage.setItem(KAFKA_STATUS_STORAGE_KEY, JSON.stringify(updatedStatuses));
                setKafkaStatuses(updatedStatuses);
            } catch (error) {
                const errorMessage = axios.isAxiosError(error)
                    ? error.response?.data?.message || "Failed to pause Kafka streaming"
                    : "Failed to pause Kafka streaming";
                message.error(errorMessage);
            } finally {
                setKafkaPauseLoadingByKey((prev) => ({ ...prev, [statusKey]: false }));
            }
        };

        const handleTerminateKafkaStream = async (status: IKafkaStreamStatus) => {
            setTerminateConfirmModal(status);
        };

        const confirmTerminateKafkaStream = async (status: IKafkaStreamStatus) => {
            const statusKey = getKafkaStatusKey(status);
            try {
                setKafkaTerminateLoadingByKey((prev) => ({ ...prev, [statusKey]: true }));
                if (status.dbId) {
                    await updateKafkaStreamConfigStatus(status.dbId, 'terminated');
                }
                const updatedStatuses = kafkaStatuses.map(s =>
                    s.topicName === status.topicName
                        ? { ...s, connected: false, streamStatus: 'terminated' as const, updatedAt: new Date().toISOString() }
                        : s
                );
                localStorage.setItem(KAFKA_STATUS_STORAGE_KEY, JSON.stringify(updatedStatuses));
                setKafkaStatuses(updatedStatuses);
                message.success("Kafka stream terminated and removed from the Extract tab.");
                setTerminateConfirmModal(null);
            } catch (error) {
                const errorMessage = axios.isAxiosError(error)
                    ? error.response?.data?.message || "Failed to terminate Kafka stream"
                    : "Failed to terminate Kafka stream";
                message.error(errorMessage);
            } finally {
                setKafkaTerminateLoadingByKey((prev) => ({ ...prev, [statusKey]: false }));
            }
        };

    const handleStartKafkaStream = async (status: IKafkaStreamStatus) => {
        const statusKey = getKafkaStatusKey(status);
        try {
            setKafkaStartLoadingByKey((prev) => ({ ...prev, [statusKey]: true }));
            console.log("▶️ Starting Kafka stream for topic:", status.topicName);
            
            // Convert the stored status back to the API request format
            const payload: KafkaStreamRequest = {
                isExistingGraph: status.isExistingGraph,
                graphId: status.graphId,
                useDefaultGraphId: status.isExistingGraph ? undefined : status.useDefaultGraphId,
                partitionAlgorithm: status.isExistingGraph ? undefined : status.partitionAlgorithm,
                isDirected: status.isExistingGraph ? undefined : status.isDirected,
                useDefaultKafka: status.useDefaultKafka,
                kafkaConfigPath: status.useDefaultKafka ? undefined : status.kafkaConfigPath,
                topicName: status.topicName,
            };

            const response = await startKafkaStream(payload);
            const resolvedGraphId = response?.data?.graphId || status.graphId;
            
            // Update the status to connected
            const updatedStatus: IKafkaStreamStatus = {
                ...status,
                connected: true,
                streamStatus: "active",
                graphId: resolvedGraphId,
                updatedAt: new Date().toISOString(),
            };

            if (status.dbId) {
                await updateKafkaStreamConfigStatus(status.dbId, "active", resolvedGraphId);
            }

            // Update the specific status in the array
            const updatedStatuses = kafkaStatuses.map(s => 
                s.topicName === status.topicName ? updatedStatus : s
            );
            
            localStorage.setItem(KAFKA_STATUS_STORAGE_KEY, JSON.stringify(updatedStatuses));
            setKafkaStatuses(updatedStatuses);
            
            message.success('Kafka streaming started successfully');
            console.log("✅ Kafka stream started for topic:", status.topicName);
        } catch (error) {
            console.error("❌ Error starting Kafka stream:", error);
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.message || "Failed to start Kafka streaming"
                : "Failed to start Kafka streaming";
            message.error(errorMessage);
        } finally {
            setKafkaStartLoadingByKey((prev) => ({ ...prev, [statusKey]: false }));
        }
    };

    const showExtractUploadPanel = showUploadSection;
    const visibleKafkaStatuses = kafkaStatuses.filter(
        (status) => normalizeStreamStatus(status.streamStatus) !== 'terminated'
    );

    const onSearch = (value: string) => {
        const filteredClusters = graphs.filter((cluster) => cluster.name.toLowerCase().includes(value.toLowerCase()));
    };

    return (
        <>
            <Spin
              spinning={loading}
              fullscreen
              indicator={<LoadingOutlined spin style={{ fontSize: 48 }} />}
              tip={
                  <div style={{ marginTop: 12, fontSize: 16 }}>
                      Fetching data from server<br />
                      Please wait, this may take a few moments.
                  </div>
              }
            />

            {visibleKafkaStatuses.map((status, index) => {
                const statusKey = getKafkaStatusKey(status);
                const isPauseLoading = Boolean(kafkaPauseLoadingByKey[statusKey]);
                const isTerminateLoading = Boolean(kafkaTerminateLoadingByKey[statusKey]);
                const isStartLoading = Boolean(kafkaStartLoadingByKey[statusKey]);

                return (
                <Card
                    key={index}
                    style={{
                        marginBottom: "20px",

                    }}
                    bodyStyle={{ padding: 16 }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 18 }}>Kafka Stream: {status.topicName || "No Topic"}</Text>
                        <Button
                            type="text"
                            icon={showKafkaDetails[index] ? <UpOutlined /> : <DownOutlined />}
                            onClick={() => setShowKafkaDetails((prev) => {
                                const newDetails = [...prev];
                                newDetails[index] = !newDetails[index];
                                return newDetails;
                            })}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ marginTop: 12, marginBottom: 12 }}>
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                    <span><Text strong>Graph ID:</Text> {status.graphId || "Default"}</span>
                                    <span><Text strong>Source:</Text> {status.useDefaultKafka ? "Server Default" : "Custom Config"}</span>
                                    <span><Text strong>Topic:</Text> {status.topicName || "—"}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                            {status.streamStatus === "paused" ? (
                                <Tag color="warning">Paused</Tag>
                            ) : (
                                <Tag color="success">Active</Tag>
                            )}
                            {status.connected ? (
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <Button
                                        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a", color: "#fff" }}
                                        onClick={() => handlePauseKafkaStream(status)}
                                        loading={isPauseLoading}
                                        size="small"
                                    >
                                        Pause
                                    </Button>
                                    <Button
                                        type="default"
                                        style={{ backgroundColor: "#000", borderColor: "#000", color: "#fff" }}
                                        onClick={() => handleTerminateKafkaStream(status)}
                                        loading={isTerminateLoading}
                                        size="small"
                                    >
                                        Terminate
                                    </Button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <Button
                                        type="primary"
                                        onClick={() => handleStartKafkaStream(status)}
                                        loading={isStartLoading}
                                        size="small"
                                    >
                                        {status.streamStatus === "paused" ? "Resume" : "Start Streaming"}
                                    </Button>
                                    <Button
                                        type="default"
                                        style={{ backgroundColor: "#000", borderColor: "#000", color: "#fff" }}
                                        onClick={() => handleTerminateKafkaStream(status)}
                                        loading={isTerminateLoading}
                                        size="small"
                                    >
                                        Terminate
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {showKafkaDetails[index] && (
                        <div style={{ marginTop: 16 }}>
                            <Descriptions bordered size="small" column={1} style={{ marginTop: 8 }}>
                                <Descriptions.Item label="Graph Mode">
                                    {status.isExistingGraph ? "Existing Graph" : "New Graph"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Partition Algorithm">
                                    {status.partitionAlgorithmLabel || "Not applicable"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Graph Type">
                                    {status.graphTypeLabel || "Not applicable"}
                                </Descriptions.Item>
                                {status.useDefaultKafka ? (
                                    <>
                                        <Descriptions.Item label="Kafka Broker">{status.kafkaBroker || "Default from server config"}</Descriptions.Item>
                                        <Descriptions.Item label="Consumer Group ID">{status.groupId || "Default from server config"}</Descriptions.Item>
                                        <Descriptions.Item label="Offset Reset">{status.offsetReset || "earliest"}</Descriptions.Item>
                                    </>
                                ) : (
                                    <Descriptions.Item label="Kafka Config Path">{status.kafkaConfigPath}</Descriptions.Item>
                                )}
                                {status.updatedAt && (
                                    <Descriptions.Item label="Connected At">{new Date(status.updatedAt).toLocaleString()}</Descriptions.Item>
                                )}
                            </Descriptions>
                        </div>
                    )}
                </Card>
                );
            })}

            {/* Terminate Confirmation Modal */}
            <Modal
                title={<span style={{ color: '#000' }}>Confirm Termination</span>}
                open={terminateConfirmModal !== null}
                onOk={() => terminateConfirmModal && confirmTerminateKafkaStream(terminateConfirmModal)}
                onCancel={() => setTerminateConfirmModal(null)}
                okText="Terminate"
                cancelText="Cancel"
                okButtonProps={{
                    loading: terminateConfirmModal ? Boolean(kafkaTerminateLoadingByKey[getKafkaStatusKey(terminateConfirmModal)]) : false,
                    style: { backgroundColor: '#000', borderColor: '#000', color: '#fff' },
                }}
                style={{ color: '#000' }}
            >
                <p style={{ color: '#000' }}>
                    Are you sure you want to terminate the Kafka stream for topic <strong>{terminateConfirmModal?.topicName}</strong>?
                </p>
                <p style={{ color: '#000', marginTop: '12px' }}>
                    This action will remove the stream from the extract tab and cannot be undone.
                </p>
            </Modal>

            {showExtractUploadPanel &&
                <div className="graph-upload-panel">
                    <Typography.Title level={4} style={{ margin: "20px 0px" }}>
                        Extract Graph Data:
                    </Typography.Title>
                    <Dragger multiple={false} maxCount={1} beforeUpload={(file: RcFile) => handleFileUpload(file)}>
                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    </Dragger>

                    <Modal title=""   footer={null}     open={modalOpen}  onCancel={()=>setModalOpen(false)}>
                        {modalOpen  && <KgForm file={file} initForm={initForm as IKnowledgeGraph} onSuccess={()=>  {
                            setShowUploadSection(false)
                            setModalOpen(false)}} currentPage={0}/>
                        }
                    </Modal>

                    <Button type="primary" style={{ margin: "20px 0px", width: "100%" }} onClick={() => setModalOpen(true)}>
                        Upload
                    </Button>
                    <Divider>or</Divider>

                    <Row className="external-upload">
                        <Col xs={20} sm={16} md={12} lg={12} xl={12}>
                            <div className="upload-card" onClick={() => setHadoopModelOpen(true)}>
                                <Image src={HADOOP_LOGO_SRC} width={200} height={120} alt="Hadoop HDFS" />
                            </div>
                        </Col>
                    </Row>


                </div>}
            <Modal title=""   footer={null}     open={hadoopModalOpen} onCancel={()=>setHadoopModelOpen(false)}>
                {hadoopModalOpen  && <HadoopKgForm  currentPage={isLocalFileUpload? 1: 0} initForm={initForm as IKnowledgeGraph} onSuccess={()=>  {
                    setShowUploadSection(false)
                    setHadoopModelOpen(false)}}/>
                }
            </Modal>

            {!showExtractUploadPanel && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                </div>
            )}

            { !showExtractUploadPanel && hasActiveUploads &&
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                    <Typography><Title level={2}>On Progress Extraction</Title></Typography>
                    <div style={{ gap: "10px", display: "flex" }}>
                        <Search placeholder="search..." allowClear size="large" onSearch={onSearch} style={{ width: 300 }} />
                    </div>
                </div>}

            {!showExtractUploadPanel && hasActiveUploads &&
                uploadBytesGraphs.updates.map((upload: IKnowledgeGraph, index) => upload.percentage <= 100 && (
                    <Card
                        key={index}
                        hoverable
                        style={{
                            width: "100%",
                            marginBottom: "20px",
                            border: "1px solid gray",
                            borderRadius: "10px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                    >
                        <Typography>

                            {/* ✅ Show Metadata */}

                                    <>

                                        <div key={upload.graphId}>




                                            <div
                                                onClick={() => setShowMeta(upload.graphId)}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "flex-start",
                                                    cursor: "pointer",
                                                    color: "#1677ff",
                                                    fontSize: "14px",
                                                    marginBottom: "8px"
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <Text strong>Graph Id: {upload.graphId}  </Text>
                                                </div>
                                                {showMeta == upload.graphId ? (
                                                    <>
                                                        <UpOutlined style={{ marginLeft: 6 }} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <DownOutlined style={{ marginLeft: 6 }} />
                                                    </>
                                                )}
                                            </div>

                                            {showMeta == upload.graphId && (
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "1fr 1fr 1fr",
                                                        gap: "6px 6px",
                                                        fontSize: "14px",
                                                        marginBottom: "10px"
                                                    }}
                                                >
                                                    <Text type="secondary"><strong>HDFS Path:</strong> {upload.uploadPath}</Text>
                                                    <Text type="secondary"><strong>Model:</strong> {upload.model}</Text>
                                                    <Text type="secondary"><strong>Instantaneous Triples Per second :</strong> {upload.triplesPerSecond}</Text>

                                                    <Text type="secondary"><strong>HDFS IP:</strong> {upload.hdfsIp}:{upload.hdfsPort}</Text>
                                                    <Text type="secondary"><strong>Inference:</strong> {upload.inferenceEngine}</Text>
                                                    <Text type="secondary"><strong>Avg.  Triples Per Second :</strong> {getAverageTPS(upload.graphId).toFixed(2)}</Text>


                                                    <Text type="secondary"><strong>Chunk Size:</strong> {upload.chunkSize}</Text>
                                                    <Text type="secondary"><strong>LLM Runner:</strong> {upload.llmRunnerString}</Text>
                                                    <Text type="secondary"><strong>Bytes Per Second</strong> {upload.bytesPerSecond}</Text>
                                                </div>
                                            )}
                                        </div>


                                        <div style={{ marginTop: "10px" }}>

                                            <SegmentedProgress progress={upload.percentage}  />
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "14px" }}>
                                            <Text type="secondary">Uploaded: {formatSize(upload.uploaded)} ( {upload.percentage.toFixed(2)}% )</Text>
                                            <Text type="secondary">Total: {formatSize(upload.total)}</Text>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "14px" }}>
                                        </div>

                                        {upload.startTime && (
                                            <div style={{ marginTop: "4px", fontSize: "14px", textAlign: "right" }}>
                                                <Text type="secondary">Start Time: {upload.startTime}</Text>
                                            </div>
                                        )}

                                        {/* Pause & Stop buttons */}
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                            <Button
                                                type={pausedGraphs[upload.graphId] ? "default" : "primary"}
                                                onClick={() =>{
                                                    if (upload.kgConstructionStatus === "paused") {
                                                        getKGConstructionMetaData(upload.graphId).then(kgConstructMeta=>{
                                                            setInitForm(upload);
                                                            setHadoopModelOpen(true);
                                                            message.success("Graph construction paused");
                                                            setPausedGraphs((prev) => ({ ...prev, [upload.graphId]: true }));
                                                        })
                                                    }else {
                                                        pauseKGConstruction(upload.graphId)

                                                    }

                                                }}
                                            >
                                                {upload.kgConstructionStatus === "paused" ? "Resume" : "Pause"}
                                            </Button>
                                            <Button danger onClick={() => stopKGConstruction(upload.graphId)}>Stop</Button>
                                        </div>
                                    </>


                        </Typography>
                    </Card>

                ))
            }
        </>
    );
}
