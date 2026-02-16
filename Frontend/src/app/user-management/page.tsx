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
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Highlighter from 'react-highlight-words';
import { Tag, Button, Modal, Input, Space, Table, Layout, theme, message, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { TableProps, PaginationProps } from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import UserRegistrationForm from "@/components/cluster-details/user-registration-form";
import PageWrapper from "@/layouts/page-wrapper";
import { useAppSelector } from "@/redux/hook";
import { IUserAccessData } from "@/types/user-types";
import { getAllUsers } from "@/services/user-service";
import { set_Users_Cache } from "@/redux/features/cacheSlice";
import { useActivity } from "@/hooks/useActivity";
import ActivityPanel from "@/components/common/ActivityPanel";

const { Content } = Layout;

interface DataType {
  key: string;
  userID: string;
  name: string;
  email: string;
  role: string;
  status: boolean;
  [key: string]: string | boolean;
}

const PaginationProps = {
  defaultPageSize: 5,
  showSizeChanger: true,
  pageSizeOptions: ["5", "10", "20", "50"],
  showTotal: (total: number, range: [number, number]) =>
    `${range[0]}-${range[1]} of ${total} items`,
} as PaginationProps;

export default function Clusters() {
  const router = useRouter();
  const { reportErrorFromException } = useActivity();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const dispatch = useDispatch();
  const { users, state } = useAppSelector(state => state.cacheData)
  const [userData, setUserData] = useState<IUserAccessData[]>(users);
  
  const [openModal, setOpenModal] = useState<boolean>(false);

  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);
  const [form] = Form.useForm();

  const showModal = () => {
    setOpenModal(true);
    form.resetFields();
  };

  useEffect(() => {
    console.log(userData)
  }, [userData])

  const getTableData = () => {
    return userData.map((data) => {
      return {
        key: data.id,
        userID: data.id,
        name: data.firstName + " " + data.lastName,
        email: data.email,
        role: data.role,
        status: data.enabled,
      };
    });
  }

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: string,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: string): TableColumnType<DataType> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'UserID',
      dataIndex: 'userID',
      key: 'ID',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('Name')
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ...getColumnSearchProps('Email')
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'status',
      render: (_, { status: Status }) => (
        <>
          {Status ? (
            <Tag color={'green'}>
              {"Active"}
            </Tag>) : (
            <Tag color={"volcano"}>
              {"Inactive"}
            </Tag>
          )}
        </>
      ),
    }
  ];

  const fetchUserData = async () => {
    try{
      const res = await getAllUsers();
      if(res.data){
        const mappedUsers: IUserAccessData[] = res.data.map((user: any) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          enabled: user.enabled,
        }));
        setUserData(mappedUsers)
        dispatch(set_Users_Cache(mappedUsers))
      }
    }catch(err){
      message.error("Failed to fetch user data")
      reportErrorFromException(
        "User Management",
        err,
        "Failed to fetch user data."
      );
    }
  }

  useEffect(()=> {
    if(!state.isUsersCacheLoaded){
      fetchUserData();
    }
  }, [state])

  const afterUserRegistration = () => {
    setOpenModal(false);
    fetchUserData();
  }

  return (
    <PageWrapper>
      <Layout style={{ padding: "24px 24px", height: "92vh" }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Modal
            title="Add New User"
            open={openModal}
            footer={<></>}
            onCancel={() => setOpenModal(false)}
          >
            <UserRegistrationForm form={form} onSuccess={afterUserRegistration} />
          </Modal>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{marginBottom: "20px"}}>
              <h1 style={{fontSize: "xx-large", fontWeight: "600", lineHeight: "1.5"}}>User Management</h1>
              <p>Manage users, add new users and change user roles. This page provides role-based access control</p>
            </div>
            <Button size="large" onClick={showModal}>Add New User</Button>
          </div>
          <Table 
            columns={columns} 
            dataSource={getTableData()} 
            pagination={PaginationProps} 
            scroll={{ y: "60vh" }}/>
          <ActivityPanel featureName="User Management" />
        </Content>
      </Layout>
    </PageWrapper>
  );
}
