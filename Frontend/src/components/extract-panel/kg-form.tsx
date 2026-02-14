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
} from "antd";
import {IKnowledgeGraph} from "@/types/graph-types";

const { Option } = Select;
const { Step } = Steps;



const KgForm = ({
                    onSuccess,
                    currentPage,
                    initForm,
                    file
                }: {
    onSuccess: () => void,
    currentPage: number,
    initForm: IKnowledgeGraph,
    file?: File | undefined
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


    const validateLLM = async () => {
        try {
            const values = await form.validateFields(["llmAllocations", "inferenceEngine"]);
            const engine = values.inferenceEngine;
            const allocations = values.llmAllocations;
            const runners = allocations.map((a: any) => a.runner);

            message.loading("Fetching models from engine...", 0);

            let modelsFetched: string[] = [];

            for (const runner of runners) {
                try {
                    let url = "";
                    if (engine === "ollama") url = `${runner}/api/tags`;
                    else if (engine === "vllm") url = `${runner}/v1/models`;
                    if (!url) continue;

                    const res = await axios.get(url);

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
                message.warning("Could not fetch models. Please verify runner URLs or network.");
            } else {
                setModels(modelsFetched);

                message.success(`Successfully fetched ${modelsFetched.length} models`);
                setCurrentStep(1);
            }


        } catch (err) {
            console.error("LLM validation error:", err);
            message.error("Please fix LLM configuration errors");
        }
    };

    const onFinish = async (values: any) => {
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
            if (!file) {
                message.error("Please select a file to upload");
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append("llmRunnerString",  llmRunnerString);
            formData.append("inferenceEngine",  finalValues.inferenceEngine);
            formData.append("model",  finalValues.model);
            formData.append("chunkSize",  finalValues.chunkSize);
            formData.append("status",   initForm?.status);
            formData.append("graphId",   initForm?.graphId);

            formData.append('textFileName', finalValues.graphName);
            try {
                await axios.post('/backend/graph/construct-kg-local', formData, { headers: { 'Content-Type': 'multipart/form-data', 'Cluster-ID': localStorage.getItem('selectedCluster') } });
            } catch (error) {
                message.error("Failed to upload file");
            }


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
                    <div style={{ display: currentStep === 0 ? "block" : "none" }}>
                        <Form.Item
                            name="graphName"
                            label="Graph Name"

                        >
                            <Input />
                        </Form.Item>
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

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {/* Keep a placeholder div to preserve spacing */}
                            <div style={{ visibility: currentStep === 1 && initForm?.status !== "paused" ? "visible" : "hidden" }}>
                                <Button onClick={() => setCurrentStep(0)}>Back</Button>
                            </div>

                            <Button type="primary" onClick={validateLLM}>
                                Next: Fetch Models
                            </Button>
                        </div>
                    </div>

                {currentStep === 1 && (
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
                            <Button onClick={() => setCurrentStep(1)}>Back</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {initForm?.status === "paused"
                                    ? "Resume Construction"
                                    : "Start Construction"}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
};

export default KgForm;
