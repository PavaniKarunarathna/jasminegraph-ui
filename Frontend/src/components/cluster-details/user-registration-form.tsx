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
import type { FormInstance } from 'antd';
import {
  Button,
  Form,
  Input,
  message,
  Select,
} from 'antd';
import { USER_ROLES } from '@/data/user-data';
import { registerUser } from '@/services/auth-service';
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
}

const UserRegistrationForm = ({onSuccess, form}: props) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { reportErrorFromException } = useActivity();

  const onFinish = async (values: any) => {
    setLoading(true);
    try{
      const res = await registerUser(values.firstName, values.lastName, values.email, values.password, values.role);
      message.loading("Creating profile", 2);
      onSuccess();
      form.resetFields();
    }catch(err){
      message.error("Failed to create profile");
      reportErrorFromException(
        "User Management",
        err,
        "Failed to create profile."
      );
    }
    setLoading(false);
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
        name="firstName"
        label="First Name"
        tooltip="Enter your first name."
        rules={[{ required: true, message: 'Please input your first name!', whitespace: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="lastName"
        label="Last Name"
        tooltip="Enter your last name."
        rules={[{ required: true, message: 'Please input your last name!', whitespace: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="email"
        label="E-mail"
        rules={[
          {
            type: 'email',
            message: 'The input is not valid E-mail!',
          },
          {
            required: true,
            message: 'Please input your E-mail!',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item 
        name="role"
        label="Select"
      >
        <Select>
          {USER_ROLES.map((role, index) => (
            <Select.Option key={index} value={role.value}>{role.label}</Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
        ]}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="confirm"
        label="Confirm Password"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Please confirm your password!',
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The new password that you entered do not match!'));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserRegistrationForm;
