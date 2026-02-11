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

import React, { useState } from 'react';
import {
  Button,
  Form,
  FormInstance,
  Input,
  message,
  Select,
  Space,
} from 'antd';
import { addNewCluster } from '@/services/cluster-service';
import useAccessToken from '@/hooks/useAccessToken';
import { useActivity } from "@/hooks/useActivity";

const { Option } = Select;

interface DataNodeType {
  value: string;
  label: string;
  children?: DataNodeType[];
}

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

type props = {
  onSuccess: () => void;
  form: FormInstance;
  onCancel?: () => void;
}

const ClusterRegistrationForm = ({ onSuccess, form, onCancel }: props) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { getSrvAccessToken } = useAccessToken();
  const { reportErrorFromException } = useActivity();

  const onFinish = async (values: any) => {
    setLoading(true);
    try{
      const token = getSrvAccessToken() || "";
      const response = await addNewCluster(values.name, values.description, values.host, values.port, token);
      if ('errorCode' in response) {
        message.error(response.message);
        reportErrorFromException(
          "Clusters",
          response.message,
          "Failed to add new cluster."
        );
      } else {
        message.loading("Connecting New Cluster", 2);
        onSuccess();
        form.resetFields();
      }
    } catch (err) {
      message.error("An unexpected error occurred while adding the cluster.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    if (onCancel) onCancel();
  };

  return (
    <Form
      {...formItemLayout}
      form={form}
      name="register"
      onFinish={onFinish}
      style={{ maxWidth: 600 }}
      scrollToFirstError
    >
      <Form.Item
        name="name"
        label="Cluster Name"
        tooltip="Enter your username. Keep it simple and recognizable."
        rules={[{ required: true, message: 'Please input your cluster name!', whitespace: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <Input />
      </Form.Item>

      <Form.Item 
        name="host"
        label="Host"
        rules={[{ required: true, message: 'Please input the host!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item 
        name="port"
        label="Port"
        rules={[{ required: true, message: 'Please input the port!' }]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item {...tailFormItemLayout}>
        <Space size="middle">
          <Button type="primary" htmlType="submit" loading={loading}>
            Add
          </Button>
          <Button htmlType="button" onClick={handleCancel} style={{ marginLeft: 8 }}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ClusterRegistrationForm;
