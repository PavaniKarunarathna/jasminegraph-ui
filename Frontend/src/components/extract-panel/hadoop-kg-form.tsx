/**
 Copyright 2025 JasmineGraph Team
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
/**
 * HDFS Knowledge Graph Construction Stepper Form
 * With HDFS validation, LLM runner check, and model fetching
 */
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    Button,
    Form,
    Input,
    InputNumber,
    Select,
    message,
    Steps,
    Alert,
    Card,
} from "antd";
import useAccessToken from "@/hooks/useAccessToken";
import { constructKG } from "@/services/graph-service";
import {authApi} from "@/services/axios";
import {IKnowledgeGraph} from "@/types/graph-types";

const { Option } = Select;
const { Step } = Steps;

const HadoopKgForm = ({
                          onSuccess,
                          currentPage,
                          initForm
                      }: {
    onSuccess: () => void,
    currentPage: number,

    initForm: IKnowledgeGraph,

}) => {
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(currentPage);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [models, setModels] = useState<string[]>([]);
    const [savedValues, setSavedValues] = useState<Record<string, any>>({});
    // Persist form changes
    const handleValuesChange = (_: any, allValues: any) => {
        setSavedValues(allValues);
    };

    // Load initial form values
    useEffect(() => {
        if (initForm && Object.keys(initForm).length > 0) {
            const newValues: any = { ...initForm };
            if (initForm.llmRunnerString) {
                const counts: Record<string, number> = {};
                initForm.llmRunnerString.split(",").forEach((r) => {
                    counts[r] = (counts[r] || 0) + 1;
                });
                newValues.llmAllocations = Object.entries(counts).map(([runner, chunks]) => ({
                    runner,
                    chunks,
                }));
            }
            form.setFieldsValue(newValues);
            setSavedValues(newValues);
        }
    }, [initForm, form]);
    useEffect(() => {
        // Determine initial step
        if (initForm?.status === "paused") {
            setCurrentStep(1); // Skip HDFS step
        } else {
            if(currentPage == 1 ){
                setCurrentStep(1);

            } else {
                setCurrentStep(0);
            }
        }
    }, [initForm]);
    const validateHDFS = async () => {
        try {
            setLoading(true)
            setFormError(null);

            await form.validateFields(["hdfsIp", "hdfsPort", "hdfsFilePath"]);
            const { hdfsIp, hdfsPort, hdfsFilePath } = form.getFieldsValue([
                "hdfsIp", "hdfsPort", "hdfsFilePath"
            ]);

            message.loading("🔍 Validating HDFS file...", 0);

            const response =  await constructKG(
                hdfsIp,
                hdfsPort,
                hdfsFilePath,
                null,
                null,
                null,
                null,
                null,
                null
            );
            message.destroy();
            console.log(response["status"]);

            if (response["status"] == 200) {
                message.success("✅ File found and HDFS validated successfully");
                setFormError(null)
                setCurrentStep(1);
            } else {

                setFormError(response["message"])
            }

        } catch (err: any) {
            message.destroy();
            console.error(err);
            setFormError(err)
            message.error("⚠️ Failed to validate HDFS configuration");
        } finally {
            setLoading(false);

        }
    };


    const validateLLM = async () => {
        try {
            setFormError(null);
            setLoading(true);


            const values = await form.validateFields(["hdfsIp", "hdfsPort", "hdfsFilePath", "llmAllocations", "inferenceEngine"]);
            const engine = values.inferenceEngine;
            const allocations = values.llmAllocations;
            const llmRunnerString = allocations
                .map((r: { runner: string; chunks: number }) => `${r.runner}:${r.chunks}`)
                .join(",");
            message.loading("🔍 Validating inference engine ...", 0);

            const response =  await constructKG(
                values.hdfsIp,
                values.hdfsPort,
                values.hdfsFilePath,
                llmRunnerString,
                engine,
                null,
                null,
                null,
                null
            );

            message.destroy();
            if (response["status"] == 200) {
                setCurrentStep(1);
            } else {
                setFormError(response["message"]);
                return
            }

            const runners = allocations.map((a: any) => a.runner);

            message.loading("Fetching models from engine...", 0);

            let modelsFetched: string[] = [];

            for (const runner of runners) {
                try {
                    let url = "";
                    if (engine === "ollama") url = `${runner}/api/tags`;
                    else if (engine === "vllm") url = `${runner}/v1/models`;
                    if (!url) continue;

                    const res = await axios.get(url, { timeout: 8000 });

                    const data = res.data;
                    if (engine === "ollama" && data.models) {
                        modelsFetched = data.models.map((m: any) => m.name);
                    } else if (engine === "vllm" && data.data) {
                        modelsFetched = data.data.map((m: any) => m.id || m.name);
                    }

                    if (modelsFetched.length > 0) break;
                } catch (err: any) {
                    console.warn(`Failed to fetch from ${runner}:`, err.message || err);
                }
            }

            message.destroy();

            if (modelsFetched.length === 0) {
                message.warning("⚠️ Could not fetch models. Please verify runner URLs or network.");
            } else {
                setFormError(null);
                setModels(modelsFetched);
                message.success(`✅ Successfully fetched ${modelsFetched.length} models`);
                setCurrentStep(2);
            }


        } catch (err) {
            console.error("LLM validation error:", err);
            message.error("Please fix LLM configuration errors");
        } finally {
            setLoading(false);

        }
    };

    const onFinish = async (values: any) => {
        console.log("testing bug");
        setLoading(true);
        setFormError(null);

        const finalValues = { ...savedValues, ...values };
        const allocations = finalValues.llmAllocations || [];
        if (allocations.length === 0) {
            setFormError("Please add at least one LLM runner.");
            setLoading(false);
            return;
        }

        try {


            const llmRunnerString = allocations
                .map((r: { runner: string; chunks: number }) => `${r.runner}:${r.chunks}`)
                .join(",");

            await constructKG(
                finalValues.hdfsIp,
                finalValues.hdfsPort,
                finalValues.hdfsFilePath,
                llmRunnerString,
                finalValues.inferenceEngine,
                finalValues.model,
                finalValues.chunkSize,
                initForm?.status,
                initForm?.graphId
            );

            message.success("Knowledge Graph construction started");
            onSuccess();
        } catch (err) {
            console.log(err);
            setFormError("Failed to start graph. Check inputs or network.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Steps
                current={currentStep}
                style={{ marginBottom: 50 }}
                labelPlacement="vertical"
            >
                <Step title="HDFS Configuration" />
                <Step title="LLM Runner Setup" />
                <Step title="Start Construction" />
            </Steps>
            <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
                style={{ gap: 16, display: "flex", flexDirection: "column" }} // 👈 Add this line

                onValuesChange={handleValuesChange}
            >

                    <div style={{ display: currentStep === 0 && initForm?.status !== "paused" ? "block" : "none" }}>

                    <Form.Item
                            name="hdfsIp"
                            label="HDFS Server IP"
                            rules={[
                                { required: true, message: "Enter HDFS IP" },
                                {
                                    pattern:
                                        /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/,
                                    message: "Invalid IPv4 address",
                                },
                            ]}
                        >
                            <Input placeholder="e.g., 192.168.1.10" />
                        </Form.Item>

                        <Form.Item
                            name="hdfsPort"
                            label="HDFS Port"
                            rules={[
                                { required: true, message: "Enter HDFS port" },
                                { pattern: /^([1-9][0-9]{0,4})$/, message: "Port 1–65535" },
                            ]}
                        >
                            <Input placeholder="e.g., 9000" />
                        </Form.Item>

                        <Form.Item
                            name="hdfsFilePath"
                            label="HDFS File Path"
                            rules={[
                                { required: true, message: "Enter file path" },
                                {
                                    pattern: /^\/(?:[a-zA-Z0-9._-]+\/)*[a-zA-Z0-9._-]*$/,
                                    message: "Invalid path format",
                                },
                            ]}
                        >
                            <Input placeholder="/path/to/file" />
                        </Form.Item>
                        {formError && (
                            <Alert
                                message={formError}
                                type="error"
                                showIcon
                                closable
                                onClose={() => setFormError(null)}
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button type="primary" disabled={loading} onClick={validateHDFS}>
                                Next: Validate HDFS
                            </Button>
                        </div>
                    </div>


                    <div style={{ display: currentStep === 1 ? "block" : "none" }}>
                        <Form.List name="llmAllocations" initialValue={[{ runner: "", chunks: 1 }]}>
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...rest }) => (
                                        <div
                                            key={key}
                                            style={{ display: "flex", gap: 8, marginBottom: 8 }}
                                        >
                                            <Form.Item
                                                {...rest}
                                                name={[name, "runner"]}
                                                rules={[
                                                    { required: true, message: "Enter LLM Runner" },
                                                    {
                                                        pattern: /^(https?:\/\/)(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?$/,

                                                        message: "Enter valid URL or IP",
                                                    },
                                                ]}
                                                label="LLM Engine Location"
                                                style={{ flex: 2 }}
                                            >
                                                <Input placeholder="http://localhost:11434" />
                                            </Form.Item>
                                            <Form.Item
                                                label="Chunk(s)"
                                                {...rest}
                                                name={[name, "chunks"]}
                                                rules={[{ required: true, message: "Enter chunks" }]}
                                                style={{ flex: 1 }}
                                            >
                                                <InputNumber min={1} placeholder="Chunks" />
                                            </Form.Item>
                                            <Button danger type="link" onClick={() => remove(name)}>
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block>
                                        Add LLM Runner
                                    </Button>
                                </>
                            )}
                        </Form.List>

                        <div>
                            <br/>
                            <br/>
                        </div>
                        <Form.Item
                            name="inferenceEngine"
                            label="Inference Engine"
                            rules={[{ required: true, message: "Select engine" }]}
                        >
                            <Select placeholder="Select engine">
                                <Option value="ollama">Ollama</Option>
                                <Option value="vllm">vLLM</Option>
                                <Option value="transformers">Transformers</Option>
                            </Select>
                        </Form.Item>
                        {formError && (
                            <Alert
                                message={formError}
                                type="error"
                                showIcon
                                closable
                                onClose={() => setFormError(null)}
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {/* Keep a placeholder div to preserve spacing */}
                            <div style={{ visibility: currentStep === 1 && initForm?.status !== "paused" ? "visible" : "hidden" }}>
                                <Button  disabled={loading} onClick={() => {
                                    setFormError(null)
                                    setCurrentStep(0)
                                }}>Back</Button>
                            </div>

                            <Button type="primary" disabled={loading} onClick={validateLLM}>
                                Next: Fetch Models
                            </Button>
                        </div>
                    </div>

                {currentStep === 2 && (
                    <>
                        <Form.Item
                            name="model"
                            label="Model Name"
                            rules={[{ required: true, message: "Select a model" }]}
                        >
                            {models.length > 0 ? (
                                <Select placeholder="Select model">
                                    {models.map((m) => (
                                        <Option key={m} value={m}>
                                            {m}
                                        </Option>
                                    ))}
                                </Select>
                            ) : (
                                <Input placeholder="Enter model manually" />
                            )}
                        </Form.Item>

                        <Form.Item
                            name="chunkSize"
                            label="Chunk Size (Bytes)"
                            rules={[
                                { required: true, message: "Enter chunk size" },
                                { pattern: /^[0-9]+$/, message: "Must be numeric" },
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        {formError && (
                            <Alert
                                message={formError}
                                type="error"
                                showIcon
                                closable
                                onClose={() => setFormError(null)}
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <Button disabled={loading} onClick={() => setCurrentStep(1)}>Back</Button>
                            <Button type="primary" htmlType="submit" disabled={loading} loading={loading}>
                                {initForm?.status === "paused"
                                    ? "Resume Construction"
                                    : (formError? "Retry Construction":  "Start Construction")}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
};

export default HadoopKgForm;
