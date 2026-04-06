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
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  Button,
  Col,
  Divider,
  message,
  Row,
  Typography,
  Upload,
  Modal,
  Input,
} from "antd";
import Image from "next/image";
import KafkaUploadModal from "@/components/graph-panel/kafka-upload-modal";
import HadoopUploadModal from "@/components/graph-panel/hadoop-upload-modal";
import { RcFile } from "antd/es/upload/interface";
import { toast } from "react-toastify";
import axios from "axios";
import { useActivity } from "@/hooks/useActivity";
import { useRouter } from "next/navigation";
import * as Routes from "@/routes/page-routes";
import { IKafkaStreamStatus, IGraphDetails } from "@/types/graph-types";
import { getGraphList, getKafkaStreamingDefaults } from "@/services/graph-service";

const KAFKA_LOGO_SRC = "/assets/images/kafka-logo.jpg";
const HADOOP_LOGO_SRC = "/assets/images/hadoop-logo.jpg";

const { Dragger } = Upload;

export default function GraphUpload() {
  const { reportErrorFromException } = useActivity();
  const router = useRouter();
  const [kafkaModalOpen, setKafkaModelOpen] = useState<boolean>(false);
  const [hadoopModalOpen, setHadoopModelOpen] = useState<boolean>(false);
  const [file, setFile] = useState<File>();
  const [fileUrl, setFileUrl] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [graphName, setGraphName] = useState<string>("");
  
  // Data for Kafka modal
  const [graphs, setGraphs] = useState<IGraphDetails[]>([]);
  const [kafkaDefaults, setKafkaDefaults] = useState({
    broker: '',
    groupId: '',
    offsetReset: 'earliest',
  });
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch graphs and Kafka defaults when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [graphResult, defaultsResult] = await Promise.allSettled([
          getGraphList(),
          getKafkaStreamingDefaults()
        ]);

        if (graphResult.status === 'fulfilled') {
          setGraphs(graphResult.value.data);
        } else {
          console.error('Failed to load graph list:', graphResult.reason);
          message.error('Failed to load graph list');
        }

        if (defaultsResult.status === 'fulfilled') {
          const properties = (defaultsResult.value?.data ?? {}) as Record<string, unknown>;
          const broker = typeof properties.broker === 'string' ? properties.broker.trim() : '';
          const groupId = typeof properties.groupId === 'string' ? properties.groupId.trim() : '';
          const offsetReset = typeof properties.offsetReset === 'string' ? properties.offsetReset.trim() : 'earliest';

          setKafkaDefaults({
            broker: broker || '',
            groupId: groupId || '',
            offsetReset,
          });
        } else {
          console.error('Failed to load Kafka defaults:', defaultsResult.reason);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = (file: RcFile) => {
    setModalOpen(true);
    setFile(file);

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
    } else {
      setFileUrl(undefined);
    }
    return false;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

      const formData = new FormData();
      formData.append('file', file);    
      formData.append('graphName', graphName); // Append the file name

      // Send the file and filename with Axios POST request
      axios.post('/backend/graph/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          "Cluster-ID": localStorage.getItem("selectedCluster")

        }
      })
      .then(response => {
        message.success("File uploaded successfully");
      })
      .catch(error => {
        message.error("Failed to upload file");
        reportErrorFromException(
          "Graph Panel",
          error,
          "Failed to upload graph file to the server."
        );
      });

      setModalOpen(false);
  };

  return (
    <div className="graph-upload-panel">
      <Typography.Title level={4} style={{ margin: "20px 0px" }}>
        Upload Graph Data:
      </Typography.Title>
      <Dragger
        multiple={false}
        maxCount={1}
        beforeUpload={(file: RcFile) => handleFileUpload(file)}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
      </Dragger>
      <Modal
        title="Upload Graph"
        centered
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        styles={{ footer: { display: "none" } }}
      >
        <div className="flex whitespace-nowrap gap-4 mt-5">
          <div>Graph Name:</div>
          <Input
            value={graphName}
            onChange={(event) => setGraphName(event.currentTarget.value)}
          />
        </div>
        <Button
          type="primary"
          style={{ margin: "20px 0px", width: "100%" }}
          onClick={handleUpload}
        >
          Upload
        </Button>
      </Modal>
      <Button
        type="primary"
        style={{ margin: "20px 0px", width: "100%" }}
        onClick={() => setModalOpen(true)}
      >
        Upload
      </Button>
      <Divider>or</Divider>
      <Row className="external-upload">
        <Col xs={20} sm={16} md={12} lg={12} xl={12}>
          <div 
            className={`upload-card ${dataLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !dataLoading && setKafkaModelOpen(true)}
          >
            {dataLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="text-sm text-gray-600">Loading...</div>
              </div>
            )}
            <Image src={KAFKA_LOGO_SRC} width={200} height={120} alt="Apache Kafka" />
          </div>
        </Col>
        <Col xs={20} sm={16} md={12} lg={12} xl={12}>
          <div className="upload-card" onClick={() => setHadoopModelOpen(true)}>
            <Image src={HADOOP_LOGO_SRC} width={200} height={120} alt="Hadoop HDFS" />
          </div>
        </Col>
      </Row>
      <KafkaUploadModal
        open={kafkaModalOpen}
        setOpen={(state: boolean) => setKafkaModelOpen(state)}
        onStreamStarted={(_payload: IKafkaStreamStatus) => {
          router.push(Routes.SIDE_MENU_ROUTES.graphPanel + Routes.GRAPH_PANEL_ROUTES.extract);
        }}
        graphs={graphs}
        kafkaDefaults={kafkaDefaults}
        dataLoading={dataLoading}
      />
      <HadoopUploadModal
        open={hadoopModalOpen}
        setOpen={(state: boolean) => setHadoopModelOpen(state)}
      />

    </div>
  );
}
