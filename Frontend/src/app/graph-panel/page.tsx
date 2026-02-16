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
import React, { useState } from "react";
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
import kafkaLOGO from "@/assets/images/kafka-logo.jpg";
import hadoopLOGO from "@/assets/images/hadoop-logo.jpg";
import Image from "next/image";
import KafkaUploadModal from "@/components/graph-panel/kafka-upload-modal";
import HadoopUploadModal from "@/components/graph-panel/hadoop-upload-modal";
import { RcFile } from "antd/es/upload/interface";
import { toast } from "react-toastify";
import axios from "axios";
import { useActivity } from "@/hooks/useActivity";

const { Dragger } = Upload;

export default function GraphUpload() {
  const { reportErrorFromException } = useActivity();
  const [kafkaModalOpen, setKafkaModelOpen] = useState<boolean>(false);
  const [hadoopModalOpen, setHadoopModelOpen] = useState<boolean>(false);
  const [file, setFile] = useState<File>();
  const [fileUrl, setFileUrl] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [graphName, setGraphName] = useState<string>("");

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
          'Content-Type': 'multipart/form-data'
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
      <KafkaUploadModal
        open={kafkaModalOpen}
        setOpen={(state: boolean) => setKafkaModelOpen(state)}
      />
      <HadoopUploadModal
        open={hadoopModalOpen}
        setOpen={(state: boolean) => setHadoopModelOpen(state)}
      />

    </div>
  );
}
