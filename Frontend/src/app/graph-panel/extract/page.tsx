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
import {Button, Col, Divider, message, Row, Typography, Upload, Modal, Input, Card, Spin} from "antd";
import Image from "next/image";
import KafkaUploadModal from "@/components/graph-panel/kafka-upload-modal";
import HadoopExtractModal from "@/components/extract-panel/hadoop-extract-modal";
import {useAppDispatch, useAppSelector} from "@/redux/hook";
import {add_upload_bytes} from "@/redux/features/queryData";
import useWebSocket, {ReadyState} from "react-use-websocket";
import axios from "axios";
import kafkaLOGO from "@/assets/images/kafka-logo.jpg";
import hadoopLOGO from "@/assets/images/hadoop-logo.jpg";
import {
    deleteGraph,
    getKGConstructionMetaData,
    getOnProgressKGConstructionMetaData,
    stopConstructKG
} from "@/services/graph-service";
import HadoopKgForm from "@/components/extract-panel/hadoop-kg-form";
import {LRUCache} from "lru-cache";
import Status = LRUCache.Status;
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import {IKnowledgeGraph} from "@/types/graph-types";

const { Dragger } = Upload;
const { Search } = Input;
const { Title, Text } = Typography;

const WS_URL = "ws://localhost:8080";

interface IUploadBytes {
    graphId: string;
    uploaded: number;
    total: number;
    percentage: number;
    triplesPerSecond?: number;
    bytesPerSecond: number;
    startTime: string;
    uploadPath: string;
}

type ISocketResponse = {
    type: string,
    clientId?: string
}

export default function GraphUpload() {
    const dispatch = useAppDispatch();
    const uploadBytesGraphs  = useAppSelector((state) => state.queryData.uploadBytes);

    const [kafkaModalOpen, setKafkaModelOpen] = useState<boolean>(false);
    const [hadoopModalOpen, setHadoopModelOpen] = useState<boolean>(false);
    const [file, setFile] = useState<File>();
    const [fileUrl, setFileUrl] = useState<string>();
    const [modalOpen, setModalOpen] = useState(false);
    const [graphName, setGraphName] = useState<string>("");
    const [showUploadSection, setShowUploadSection] = useState<boolean>(false);
    const [graphs, setGraphs] = useState<IKnowledgeGraph[]>([]);
    const [initForm, setInitForm] = useState<IKnowledgeGraph[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [clientId, setClientID] = useState<string>('');
    const [showMeta, setShowMeta] = useState<string>("");
    const [pausedGraphs, setPausedGraphs] = useState<Record<string, boolean>>({});


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

    const handleUpload = async () => {
        if (!file) {
            message.error("Please select a file to upload");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('graphName', graphName);

        try {
            await axios.post('/backend/graph/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            message.success("File uploaded successfully");
        } catch (error) {
            message.error("Failed to upload file");
        }

        setModalOpen(false);
    };

    const pauseKGConstruction = async (graphId: string) => {
        try {
            setLoading(true);
            stopConstructKG(graphId, "paused").then(()=>{

                getKGConstructionMetaData(graphId).then(kgConstructMeta=>{
                    setInitForm(kgConstructMeta.data);
                    setHadoopModelOpen(true);
                    message.success("Graph construction paused");
                    setPausedGraphs((prev) => ({ ...prev, [graphId]: true }));
                })


            })

        } catch {
            message.error("Failed to pause graph construction");
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


        } catch {
            message.error("Failed to stop graph construction");
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
        if(hadoopModalOpen || showUploadSection) return;

        setLoading(true);

        getOnProgressKGConstructionMetaData().then(res=>{
            setGraphs(res.data);
        })
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
    }, [clientId, readyState, showUploadSection, hadoopModalOpen]);

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
            {(showUploadSection || (uploadBytesGraphs && uploadBytesGraphs.updates.length === 0)) &&
                <div className="graph-upload-panel">
                    <Typography.Title level={4} style={{ margin: "20px 0px" }}>
                        Extract Graph Data:
                    </Typography.Title>
                    <Dragger multiple={false} maxCount={1} beforeUpload={(file: RcFile) => handleFileUpload(file)}>
                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    </Dragger>

                    <Modal title="Extract Graph" centered open={modalOpen} onOk={() => setModalOpen(false)} onCancel={() => setModalOpen(false)} footer={null}>
                        <div className="flex whitespace-nowrap gap-4 mt-5">
                            <div>Graph Name:</div>
                            <Input value={graphName} onChange={(event) => setGraphName(event.currentTarget.value)} />
                        </div>
                        <Button type="primary" style={{ margin: "20px 0px", width: "100%" }} onClick={handleUpload}>
                            Upload
                        </Button>
                    </Modal>

                    <Button type="primary" style={{ margin: "20px 0px", width: "100%" }} onClick={() => setModalOpen(true)}>
                        Upload
                    </Button>
                    <Divider>or</Divider>

                    <Row className="external-upload">
                        <Col xs={20} sm={16} md={12} lg={12} xl={12}>
                            <div className="upload-card" onClick={() => setKafkaModelOpen(true)}>
                                <Image src={kafkaLOGO} width={200} alt="Apache Kafka" />
                            </div>
                        </Col>
                        <Col xs={20} sm={16} md={12} lg={12} xl={12}>
                            <div className="upload-card" onClick={() => setHadoopModelOpen(true)}>
                                <Image src={hadoopLOGO} width={200} alt="Hadoop HDFS" />
                            </div>
                        </Col>
                    </Row>


                </div>}
            <KafkaUploadModal open={kafkaModalOpen} setOpen={setKafkaModelOpen} />
            <Modal title=""   footer={null}     open={hadoopModalOpen} onCancel={()=>setHadoopModelOpen(false)}>
                {hadoopModalOpen  && <HadoopKgForm  initForm={initForm[0]} onSuccess={()=>  {
                    setShowUploadSection(false)
                    setHadoopModelOpen(false)}}/>
                }
            </Modal>
            { !showUploadSection && uploadBytesGraphs.updates.length > 0 &&
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                    <Typography><Title level={2}>On Progress Extraction</Title></Typography>
                    <div style={{ gap: "10px", display: "flex" }}>
                        <Search placeholder="search..." allowClear size="large" onSearch={onSearch} style={{ width: 300 }} />
                        <Button size="large" onClick={() => setShowUploadSection(true)}>Extract New Graph</Button>
                    </div>
                </div>}

            {!showUploadSection && uploadBytesGraphs && uploadBytesGraphs.updates.length > 0 &&
                uploadBytesGraphs.updates.map((upload: IUploadBytes, index) => upload.percentage !== 100 && (
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
                            {graphs
                                .filter((g) => g.graphId === upload.graphId)
                                .map((meta) => (
                                    <>

                                        <div key={meta.graphId}>




                                            <div
                                                onClick={() => setShowMeta(meta.graphId)}
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
                                                    <Text type="secondary"><strong>Name:</strong> {meta.name}</Text>
                                                    <Text type="secondary"><strong>Model:</strong> {meta.model}</Text>
                                                    <Text type="secondary"><strong>Inference:</strong> {meta.inferenceEngine}</Text>
                                                    <Text type="secondary"><strong>LLM Runner:</strong> {meta.llmRunnerString}</Text>
                                                    <Text type="secondary"><strong>Chunk Size:</strong> {meta.chunkSize}</Text>
                                                    <Text type="secondary"><strong>HDFS Path:</strong> {meta.hdfsFilePath}</Text>
                                                    <Text type="secondary"><strong>HDFS IP:</strong> {meta.hdfsIp}:{meta.hdfsPort}</Text>
                                                    <Text type="secondary"><strong>Triples Per second :</strong> {upload.triplesPerSecond}</Text>
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
                                                    if (meta.status === "paused") {
                                                        getKGConstructionMetaData(upload.graphId).then(kgConstructMeta=>{
                                                            setInitForm(kgConstructMeta.data);
                                                            setHadoopModelOpen(true);
                                                            message.success("Graph construction paused");
                                                            setPausedGraphs((prev) => ({ ...prev, [upload.graphId]: true }));
                                                        })
                                                    }else {
                                                        pauseKGConstruction(upload.graphId)

                                                    }

                                                }}
                                            >
                                                {meta.status === "paused" ? "Resume" : "Pause"}
                                            </Button>
                                            <Button danger onClick={() => stopKGConstruction(upload.graphId)}>Stop</Button>
                                        </div>
                                    </>
                                ))
                            }
                        </Typography>
                    </Card>

                ))
            }
        </>
    );
}
