/**
Copyright 2026 JasmineGraph Team
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
import React, { useState, useEffect, useCallback } from "react";
import { Button, Divider, Layout, message, Modal, theme, Typography, Form } from "antd";
import PageWrapper from "@/layouts/page-wrapper";
import { Input } from "antd";
import type { SearchProps } from "antd/es/input/Search";
import { Card, Col, Row } from "antd";
import { useRouter } from "next/navigation";
import { IClusterDetails } from "@/types/cluster-types";
import { useDispatch } from "react-redux";
import { set_Selected_Cluster } from "@/redux/features/clusterData";
import { getAllClusters, getClustersStatusByIds } from "@/services/cluster-service";
import { useAppSelector } from "@/redux/hook";
import ClusterRegistrationForm from "@/components/cluster-details/cluster-registration-form";
import useAccessToken from "@/hooks/useAccessToken";
import ActivityPanel from "@/components/common/ActivityPanel";
import { useActivity } from "@/hooks/useActivity";

const { Search } = Input;
const { Content } = Layout;
const { Title, Text } = Typography;
export default function Clusters() {
  const router = useRouter();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { reportErrorFromException } = useActivity();
  const dispatch = useDispatch();
  const { userData } = useAppSelector((state) => state.authData);
  const [clusters, setClusters] = useState<IClusterDetails[]>([]);
  const [filteredClusters, setFilteredClusters] = useState<IClusterDetails[]>([]);

  const { selectedCluster } = useAppSelector((state) => state.clusterData);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const { getSrvAccessToken } = useAccessToken();
  const [form] = Form.useForm();

  const getAllCluster = useCallback(async () => {
    try {
      const token = getSrvAccessToken() || "";
      const clusterRes = await getAllClusters(token);
      if (!clusterRes.data) return;

      const clusters = clusterRes.data;

      const clusterIds = clusters.map((c: any) => c.id);
      const statusRes = await getClustersStatusByIds(token, clusterIds);
      const statuses = statusRes.clusters || [];

      const clustersWithStatus = clusters.map((c: any) => {
        const status = statuses.find((s: any) => s.id === c.id)?.connected ?? false;
        return { ...c, status };
      });

      setClusters(clustersWithStatus);
    } catch (err) {
      message.error("Failed to fetch JasmineGraph clusters");
      reportErrorFromException(
        "Clusters",
        err,
        "Failed to fetch JasmineGraph clusters."
      );
      console.error(err);
    }
  }, [getSrvAccessToken, reportErrorFromException]);

  const setSelectedCluster = useCallback(() => {
    const selectedClusterId = localStorage.getItem("selectedCluster");
    if (selectedClusterId) {
      const foundCluster = clusters.find((cluster) => String(cluster.id) === selectedClusterId);
      if (foundCluster && foundCluster.id === selectedCluster?.id) {
        return;
      }
      if (foundCluster) {
        dispatch(set_Selected_Cluster(foundCluster));
      }
    }
  }, [clusters, selectedCluster, dispatch]);

  useEffect(() => {
    setSelectedCluster();
  }, [clusters, setSelectedCluster]);

  useEffect(() => {
    if (userData.email && clusters.length === 0) {
      getAllCluster();
    }
  }, [getAllCluster, userData.email, clusters.length]);

  const onSearch: SearchProps["onSearch"] = (value, _e, info) => {
    const filteredClusters = clusters.filter((cluster) => {
      return cluster.name.toLowerCase().includes(value.toLowerCase());
    });
    setFilteredClusters(filteredClusters);
  }

  const handleOnClusterSelect = (cluster: IClusterDetails) => {
    dispatch(set_Selected_Cluster(cluster));
    localStorage.setItem("selectedCluster", String(cluster.id));
  }

  const handleOnClusterClick = (cluster: IClusterDetails) => {
    router.push(`/clusters/${cluster.id}`);
  }

  const showModal = () => {
    form.resetFields();
    setOpenModal(true);
  }

  const afterClusterRegistration = () => {
    setOpenModal(false);
    getAllCluster();
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
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <Typography>
              <Title level={2}>My Clusters</Title>
            </Typography>
            <div style={{gap: "10px", display: "flex"}}>
              <Search
                placeholder="search..."
                allowClear
                size="large"
                onSearch={onSearch}
                style={{ width: 300 }}
              />
              <Button size="large" onClick={showModal}>Add New Cluster</Button>
              <Modal
                title="Add New Cluster"
                open={openModal}
                footer={<></>}
                onCancel={() => setOpenModal(false)}
              >
                <ClusterRegistrationForm form={form} onSuccess={afterClusterRegistration} onCancel={() => setOpenModal(false)} />
              </Modal>
            </div>
          </div>
          {selectedCluster && (
            <>
              <Divider>Selected Cluster</Divider>
              <Col>
                <Row key={selectedCluster.id}>
                  <Card 
                    hoverable 
                    style={{ width: "100%", marginBottom: "20px", border: "1px solid gray" }}
                    onClick={() => handleOnClusterClick(selectedCluster)}
                  >
                    <Typography>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Title level={3} style={{ margin: 0 }}>{selectedCluster.name}</Title>
                        <div>
                          {(selectedCluster as any).status ? (
                            <Button
                              type="primary"
                              style={{ background: "#52c41a", borderColor: "#52c41a" }}
                            >
                              Connected
                            </Button>
                          ) : (
                            <Button type="default" danger>
                              Disconnected
                            </Button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                        <Text>Cluster ID: {selectedCluster.id}</Text>
                        <Text>Creation Date: {selectedCluster.created_at}</Text>
                      </div>
                    </Typography>
                  </Card>
                </Row>
              </Col>
            </>
          )}
          {clusters.filter((item) => selectedCluster == null || (item.id !== selectedCluster?.id)).length > 0 && (
            <>
              <Divider>All Clusters</Divider>
              <Col>
                {clusters.length > 0 ? 
                clusters.filter((item) => selectedCluster == null || (item.id !== selectedCluster?.id)).map((cluster) => (
                  <Row key={cluster.id}>
                    <Card hoverable style={{width: "100%", marginBottom: "20px", border: "1px solid gray"}}
                    >
                      <Typography>
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                        <Title level={3} onClick={() => handleOnClusterClick(cluster)}>{cluster.name}</Title>
                        <Button color="primary" type="default" onClick={() => handleOnClusterSelect(cluster)}>
                          Select
                        </Button>
                        </div>
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: 'center'}}>
                          <div>
                            <Text>Cluster ID: {cluster.id}</Text>
                            <div style={{marginTop: 4}}>
                              <Text type="secondary">Creation Date: {cluster.created_at}</Text>
                            </div>
                          </div>
                          <div>
                            { (cluster as any).status ? (
                              <Button type="primary" style={{background: '#52c41a', borderColor: '#52c41a'}}>
                                Connected
                              </Button>
                            ) : (
                              <Button type="default" danger>
                                Disconnected
                              </Button>
                            )}
                          </div>
                        </div>
                      </Typography>
                    </Card>
                  </Row>
                  )):(
                  <div className="flex justify-center items-center h-full">
                  No Clusters Found
                  </div>
                )}
              </Col>
            </>
          )}
          <ActivityPanel featureName="Clusters" />
        </Content>
      </Layout>
    </PageWrapper>
  );
}
