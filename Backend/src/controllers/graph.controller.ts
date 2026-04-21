
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
const { TelnetSocket } = require('telnet-stream');
const net = require('net');
import { Kafka } from 'kafkajs';
import { Request, Response } from 'express';
import {
    GRAPH_REMOVE_COMMAND,
    GRAPH_UPLOAD_COMMAND,
    GRAPH_DATA_COMMAND,
    LIST_COMMAND,
    TRIANGLE_COUNT_COMMAND,
    PROPERTIES_COMMAND,
    STOP_CONSTRUCT_KG_COMMAND,
    CONSTRUCT_KG_COMMAND,
    CONSTRUCT_KG_COMMAND_LOCAL,
    KAFKA_STREAM_COMMAND,
    STOP_KAFKA_STREAM_COMMAND,
    KAFKA_TOPICS_COMMAND
} from './../constants/frontend.server.constants';
import { ErrorCode, ErrorMsg } from '../constants/error.constants';
import { getClusterByIdRepo } from '../repository/cluster.repository';
import {HTTP, PDF_EXTENSION, TIMEOUT, TXT_EXTENSION, UTF8_FORMAT} from '../constants/constants';
import { parseGraphFile } from '../utils/graph';
import {
    createKGConstructionMetaRepo,
    getKGConstructionMetaByClusterRepo,
    updateKGConstructionMetaStatusRepo,
    deleteKGConstructionMetaRepo,
    KGStatus

} from "../repository/kg-construction-meta.repository";
import {
    createKafkaStreamConfigRepo,
    getKafkaStreamConfigsByClusterRepo,
    updateKafkaStreamConfigStatusRepo,
    KafkaStreamConfigStatus,
    } from "../repository/kafka-stream-config.repository";
import fs from "fs";
import path from "path";

const pdfParse = require('pdf-parse');


export let socket;
export let tSocket;

export type IConnection = {
    host: string;
    port: number;
}

type LegacyGraphRow = {
    idgraph: number;
    name: string;
    upload_path: string;
    status: string;
    vertexcount: number;
    edgecount: number;
    centralpartitioncount: number;
    partitions: any[];
};

type ClusterPropertiesPayload = {
    partitionCount: number;
    workersCount: number;
    version: string;
    broker: string;
    groupId: string;
    offsetReset: string;
};

const buildFallbackClusterProperties = (connection: IConnection): ClusterPropertiesPayload => {
    // Fallback when prp command fails. These values should ideally come from the server's prp response.
    return {
        partitionCount: 0,
        workersCount: 0,
        version: 'unknown',
        broker: '',
        groupId: 'jasminegraph-consumer',
        offsetReset: 'earliest',
    };
};

const DEV_MODE = process.env.DEV_MODE === 'true';
const  HOST = process.env.HOST ;
const  PORT = process.env.PORT ;
const CACHE_DIR = path.resolve("/app/caches");

export const getClusterDetails = async (req: Request) => {
  const clusterID = req.header('Cluster-ID');
  const cluster = await getClusterByIdRepo(Number(clusterID));
  if (!cluster) {
    return { code: ErrorCode.ClusterNotFound, message: ErrorMsg.ClusterNotFound, errorDetails: '' };
  }else{
    console.log("Cluster Connection Details: ", cluster);
    return {
      port: cluster.port,
      host: cluster.host
    };
  }
};

export const telnetConnection = (connection: IConnection) => (callback: any) => {
    // If the global connection is undefined or closed, create a new connection
    if (!socket || socket.destroyed) {
        socket = net.createConnection(connection.port, connection.host, () => {
            tSocket = new TelnetSocket(socket);

            tSocket.on('do', (option) => {
                tSocket.writeWont(option);
            });

            tSocket.on('will', (option) => {
                tSocket.writeDont(option);
            });

            console.log('Telnet connection established');
            callback(tSocket);
        });

        socket.on('error', (err) => {
            console.error('Connection error: ' + err.message);
            socket = undefined;
            tSocket = undefined;
        });

        socket.on('end', () => {
            console.log('Telnet connection closed');
            socket = undefined; // Reset socket when closed
            tSocket = undefined;
        });

        socket.on('close', () => {
            console.log('Telnet socket closed');
            socket = undefined;
            tSocket = undefined;
        });
    } else {
        callback(tSocket); // Use existing connection
    }
};

const executeTelnetCommand = (connection: IConnection, command: string, timeoutMs: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const localSocket = net.createConnection(connection.port, connection.host);
        const localTelnetSocket = new TelnetSocket(localSocket);
        let commandOutput = '';
        let settled = false;

        const finalize = (error: Error | null, output: string) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeoutRef);
            if ((localTelnetSocket as any)?.removeListener) {
                (localTelnetSocket as any).removeListener('data', onData);
                (localTelnetSocket as any).removeListener('error', onError);
            } else if ((localTelnetSocket as any)?.off) {
                (localTelnetSocket as any).off('data', onData);
                (localTelnetSocket as any).off('error', onError);
            }
            localSocket.removeListener('error', onError);
            localSocket.removeListener('connect', onConnect);
            localSocket.end();
            if (error) {
                reject(error);
            } else {
                resolve(output);
            }
        };

        const onData = (buffer: Buffer) => {
            commandOutput += buffer.toString(UTF8_FORMAT);
        };

        const onError = (error: Error) => {
            finalize(error, commandOutput);
        };

        const onConnect = () => {
            localTelnetSocket.on('do', (option: number) => {
                localTelnetSocket.writeWont(option);
            });

            localTelnetSocket.on('will', (option: number) => {
                localTelnetSocket.writeDont(option);
            });

            localTelnetSocket.on('data', onData);
            localTelnetSocket.on('error', onError);

            localTelnetSocket.write(command + '\n', UTF8_FORMAT);
        };

        const timeoutRef = setTimeout(() => {
            finalize(null, commandOutput);
        }, timeoutMs);

        localSocket.on('connect', onConnect);
        localSocket.on('error', onError);
    });
};

const extractFirstJsonPayload = (rawResponse: string): string | null => {
    const trimmed = rawResponse.trim();
    if (!trimmed) {
        return null;
    }

    const jsonObjectStart = trimmed.indexOf('{');
    const jsonObjectEnd = trimmed.lastIndexOf('}');
    if (jsonObjectStart !== -1 && jsonObjectEnd > jsonObjectStart) {
        return trimmed.substring(jsonObjectStart, jsonObjectEnd + 1);
    }

    const jsonArrayStart = trimmed.indexOf('[');
    const jsonArrayEnd = trimmed.lastIndexOf(']');
    if (jsonArrayStart !== -1 && jsonArrayEnd > jsonArrayStart) {
        return trimmed.substring(jsonArrayStart, jsonArrayEnd + 1);
    }

    return null;
};

const parseLegacyGraphList = (rawResponse: string): LegacyGraphRow[] => {
    const lines = rawResponse
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('|'));

    return lines
        .map((line) => {
            const values = line.split('|').map((item) => item.trim()).filter((item) => item.length > 0);
            if (values.length < 4) {
                return null;
            }

            const parsedId = Number(values[0]);
            if (Number.isNaN(parsedId)) {
                return null;
            }

            return {
                idgraph: parsedId,
                name: values[1],
                upload_path: values[2],
                status: values[3],
                vertexcount: 0,
                edgecount: 0,
                centralpartitioncount: 0,
                partitions: [],
            } as LegacyGraphRow;
        })
        .filter((row): row is LegacyGraphRow => row !== null);
};



const fetchKafkaTopicsFromServerCommand = async (connection: IConnection): Promise<string[]> => {
    const commandOutput = await executeTelnetCommand(connection, KAFKA_TOPICS_COMMAND, TIMEOUT.default);
    if (!commandOutput.trim()) {
        return [];
    }

    const jsonPayload = extractFirstJsonPayload(commandOutput);
    if (!jsonPayload) {
        return [];
    }

    const parsed = JSON.parse(jsonPayload) as { topics?: unknown[] };
    const topics = Array.isArray(parsed?.topics) ? parsed.topics : [];
    return topics
        .map((topic) => String(topic ?? '').trim())
        .filter((topic) => topic.length > 0)
        .filter((topic, index, all) => all.indexOf(topic) === index)
        .sort((a, b) => a.localeCompare(b));
};



const getGraphList = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host && connection.port)) {
        return res.status(404).send(connection);
    }

    try {
        const commandOutput = await executeTelnetCommand(connection, LIST_COMMAND, TIMEOUT.default);
        if (!commandOutput.trim()) {
            return res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: '' });
        }

        console.log(new Date().toLocaleString() + ' - ' + LIST_COMMAND + ' - ' + commandOutput);
        const jsonPayload = extractFirstJsonPayload(commandOutput);
        if (jsonPayload) {
            try {
                return res.status(HTTP[200]).send(JSON.parse(jsonPayload));
            } catch (error) {
                // Fallback to legacy text parser when the response is not strict JSON.
            }
        }

        const legacyRows = parseLegacyGraphList(commandOutput);
        if (legacyRows.length > 0) {
            return res.status(HTTP[200]).send(legacyRows);
        }

        return res.status(HTTP[500]).send({
            code: ErrorCode.ServerError,
            message: ErrorMsg.ServerError,
            errorDetails: 'Unable to parse graph list response from server',
        });
    } catch (err) {
        return res.status(HTTP[500]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};

const getClusterProperties = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host && connection.port)) {
        return res.status(404).send(connection);
    }

    try {
        const commandOutput = await executeTelnetCommand(connection, PROPERTIES_COMMAND, TIMEOUT.default);
        
        if (!commandOutput.trim()) {
            console.warn('Empty response from server for properties command');
            return res.status(HTTP[200]).send(buildFallbackClusterProperties(connection));
        }

        // Server returns clean JSON, parse it directly
        const parsed = JSON.parse(commandOutput) as Record<string, unknown>;
        const payload: ClusterPropertiesPayload = {
            partitionCount: Number(parsed.partitionCount ?? 0),
            workersCount: Number(parsed.workersCount ?? 0),
            version: String(parsed.version ?? 'unknown'),
            broker: String(parsed.broker ?? '').trim(),
            groupId: String(parsed.groupId ?? 'jasminegraph-consumer'),
            offsetReset: String(parsed.offsetReset ?? 'earliest'),
        };

        console.log(new Date().toLocaleString() + ' - ' + PROPERTIES_COMMAND + ' - Success');
        return res.status(HTTP[200]).send(payload);
    } catch (err) {
        console.error('Failed to fetch cluster properties:', err);
        return res.status(HTTP[200]).send(buildFallbackClusterProperties(connection));
    }
};

const withKafkaAdmin = async <T>(brokers: string[], handler: (admin: any) => Promise<T>) => {
    const kafka = new Kafka({
        clientId: 'jasminegraph-ui-backend',
        brokers,
    });

    const admin = kafka.admin();
    await admin.connect();
    try {
        return await handler(admin);
    } finally {
        await admin.disconnect();
    }
};

const getKafkaTopics = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host && connection.port)) {
        return res.status(404).send(connection);
    }

    try {
        // Try server command first
        const commandTopics = await fetchKafkaTopicsFromServerCommand(connection);
        if (commandTopics.length > 0) {
            return res.status(200).send({ topics: commandTopics, source: 'server-command' });
        }

        // Fallback: get brokers from query param or cluster properties
        let brokers = String(req.query?.broker ?? '')
            .split(',')
            .map((value: string) => value.trim())
            .filter(Boolean);

        if (brokers.length === 0) {
            // Get broker from cluster properties
            await getClusterProperties(req, res as any);
            // The response was already sent by getClusterProperties
            const properties = buildFallbackClusterProperties(connection);
            if (properties.broker) {
                brokers = [properties.broker];
            }
        }

        if (brokers.length === 0) {
            return res.status(400).send({ message: 'Unable to resolve Kafka broker. Provide broker in query or configure server properties' });
        }

        // Connect to Kafka broker and list topics
        const topics = await withKafkaAdmin<string[]>(brokers, async (admin) => {
            const topicNames = await admin.listTopics();
            return topicNames
                .filter((name: string) => name && !name.startsWith('__'))
                .sort((a: string, b: string) => a.localeCompare(b));
        });

        return res.status(200).send({ topics, source: 'broker-admin' });
    } catch (err: any) {
        return res.status(500).send({
            message: 'Failed to fetch Kafka topics',
            errorDetails: err?.message || err,
        });
    }
};

const uploadGraph = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(404).send(connection);
    }
    const { graphName } = req.body;
    const fileName = req.file?.filename;
    const filePath = HOST +":"+PORT + "/public/" + fileName ;

    console.log(GRAPH_UPLOAD_COMMAND + '|' + graphName + '|' + filePath + '\n');

    try {
        telnetConnection({host: connection.host, port: connection.port})(() => {
            let commandOutput = "";

            tSocket.on("data", (buffer) => {
                commandOutput += buffer.toString(UTF8_FORMAT);
            });


            tSocket.write(GRAPH_UPLOAD_COMMAND + '|' + graphName + '|' + filePath + '\n', UTF8_FORMAT, () => {
                setTimeout(() => {
                    if (commandOutput) {
                        try {
                           let output =  JSON.parse(commandOutput)
                            res.status(HTTP[200]).send(output);

                        } catch (err) {
                            return res.status(HTTP[500]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
                        }
                    } else {
                        res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
                    }
                }, TIMEOUT.default); // Adjust timeout to wait for the server response if needed
            });

        });
    } catch (err) {
        return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};

const startKafkaStream = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host && connection.port)) {
        return res.status(404).send(connection);
    }

    const {
        isExistingGraph,
        graphId,
        useDefaultGraphId,
        partitionAlgorithm,
        isDirected,
        useDefaultKafka,
        kafkaConfigPath,
        topicName,
    } = req.body;

    console.log('Kafka stream request:', {
        isExistingGraph,
        graphId,
        useDefaultGraphId,
        partitionAlgorithm,
        isDirected,
        useDefaultKafka,
        kafkaConfigPath,
        topicName,
    });

    const normalizedTopicName = String(topicName ?? "").trim();
    const normalizedGraphId = graphId === undefined || graphId === null ? "" : String(graphId).trim();
    const normalizedPartitionAlgorithm = partitionAlgorithm === undefined || partitionAlgorithm === null
        ? ""
        : String(partitionAlgorithm).trim();
    const normalizedKafkaConfigPath = kafkaConfigPath === undefined || kafkaConfigPath === null
        ? ""
        : String(kafkaConfigPath).trim();

    if (!normalizedTopicName) {
        return res.status(400).send({ message: "Kafka topicName is required" });
    }

    if (isExistingGraph && !normalizedGraphId) {
        return res.status(400).send({ message: "graphId is required for existing graph" });
    }

    if (!isExistingGraph && useDefaultGraphId === false && !normalizedGraphId) {
        return res.status(400).send({ message: "graphId is required when not using default graph id" });
    }

    if (!isExistingGraph && !normalizedPartitionAlgorithm) {
        return res.status(400).send({ message: "partitionAlgorithm is required for new graph" });
    }

    if (!isExistingGraph && normalizedPartitionAlgorithm && !["1", "2", "3"].includes(normalizedPartitionAlgorithm)) {
        return res.status(400).send({ message: "partitionAlgorithm must be one of 1, 2, or 3" });
    }

    if (useDefaultKafka === false && !normalizedKafkaConfigPath) {
        return res.status(400).send({ message: "kafkaConfigPath is required when useDefaultKafka is false" });
    }

    if (normalizedGraphId && !/^\d+$/.test(normalizedGraphId)) {
        return res.status(400).send({ message: "graphId must be a numeric value" });
    }

    try {
        const localSocket = net.createConnection(connection.port, connection.host);
        const localTelnetSocket = new TelnetSocket(localSocket);

        let commandOutput = "";
        let promptBuffer = "";
        let responded = false;

        const timeoutRef = setTimeout(() => {
            finish(504, {
                message: "Timed out while waiting for Kafka stream initialization response",
                output: commandOutput,
            });
        }, TIMEOUT.default * 6);

        const cleanup = () => {
            clearTimeout(timeoutRef);
            if ((localTelnetSocket as any)?.removeListener) {
                (localTelnetSocket as any).removeListener('data', onData);
                (localTelnetSocket as any).removeListener('error', onError);
                (localTelnetSocket as any).removeListener('do', onDo);
                (localTelnetSocket as any).removeListener('will', onWill);
            } else if ((localTelnetSocket as any)?.off) {
                (localTelnetSocket as any).off('data', onData);
                (localTelnetSocket as any).off('error', onError);
                (localTelnetSocket as any).off('do', onDo);
                (localTelnetSocket as any).off('will', onWill);
            }
            localSocket.removeListener('error', onError);
            localSocket.removeListener('connect', onConnect);
            localSocket.end();
        };

        const getResolvedGraphId = () => {
            if (graphId) {
                return String(graphId);
            }
            const defaultIdMatch = commandOutput.match(/do you use default graph id:\s*(\d+)/i);
            return defaultIdMatch?.[1];
        };

        const finish = (status: number, payload: any) => {
            if (responded) return;
            responded = true;
            cleanup();
            res.status(status).send(payload);
        };

        const writeLine = (value: string) => {
            localTelnetSocket.write(value + "\n", UTF8_FORMAT);
        };

        const onDo = (option: number) => {
            localTelnetSocket.writeWont(option);
        };

        const onWill = (option: number) => {
            localTelnetSocket.writeDont(option);
        };

        const onError = (err: Error) => {
            console.error('Telnet socket error:', err.message);
            finish(502, {
                message: 'Telnet socket error during Kafka stream initialization',
                error: err.message,
                output: commandOutput,
            });
        };

        const onData = (buffer: Buffer) => {
            const chunk = buffer.toString("utf8");
            commandOutput += chunk;
            promptBuffer += chunk.toLowerCase();

            if (promptBuffer.includes("invalid message format")) {
                finish(400, { message: 'Server does not support kafka stream command', output: commandOutput });
                return;
            }

            if (promptBuffer.includes("error:")) {
                finish(400, { message: "Server returned an error during Kafka initialization", output: commandOutput });
                return;
            }

            if (promptBuffer.includes("server is busy")) {
                finish(503, {
                    message: "JasmineGraph server is busy. Please try again later.",
                    output: commandOutput,
                });
                return;
            }

            if (promptBuffer.includes("do you want to stream into existing graph")) {
                promptBuffer = "";
                writeLine(isExistingGraph ? "y" : "n");
                return;
            }

            if (promptBuffer.includes("send the existing graph id")) {
                promptBuffer = "";
                if (!normalizedGraphId) {
                    finish(400, { message: "graphId is required for existing graph" });
                    return;
                }
                writeLine(normalizedGraphId);
                return;
            }

            if (promptBuffer.includes("do you use default graph id")) {
                promptBuffer = "";
                if (isExistingGraph) {
                    return;
                }
                writeLine(useDefaultGraphId === false ? "n" : "y");
                return;
            }

            if (promptBuffer.includes("input your graph id")) {
                promptBuffer = "";
                if (isExistingGraph) {
                    return;
                }
                if (!normalizedGraphId) {
                    finish(400, { message: "graphId is required when not using default graph id" });
                    return;
                }
                writeLine(normalizedGraphId);
                return;
            }

            if (promptBuffer.includes("choose an option")) {
                promptBuffer = "";
                if (isExistingGraph) {
                    return;
                }
                if (!normalizedPartitionAlgorithm) {
                    finish(400, { message: "partitionAlgorithm is required for new graph" });
                    return;
                }
                writeLine(normalizedPartitionAlgorithm);
                return;
            }

            if (promptBuffer.includes("is this graph directed")) {
                promptBuffer = "";
                if (isExistingGraph) {
                    return;
                }
                writeLine(isDirected ? "y" : "n");
                return;
            }

            if (promptBuffer.includes("default kafka consumer")) {
                promptBuffer = "";
                writeLine(useDefaultKafka ? "y" : "n");
                return;
            }

            if (promptBuffer.includes("kafka configuration file")) {
                promptBuffer = "";
                if (!normalizedKafkaConfigPath) {
                    finish(400, { message: "kafkaConfigPath is required when useDefaultKafka is false" });
                    return;
                }
                writeLine(normalizedKafkaConfigPath);
                return;
            }

            if (promptBuffer.includes("send kafka topic name")) {
                promptBuffer = "";
                writeLine(normalizedTopicName);
                return;
            }

            if (promptBuffer.includes("received the kafka topic") || promptBuffer.includes("start listening to")) {
                finish(200, {
                    message: "Kafka streaming started",
                    output: commandOutput,
                    graphId: getResolvedGraphId(),
                });
            }
        };

        const onConnect = () => {
            localTelnetSocket.on('do', onDo);
            localTelnetSocket.on('will', onWill);
            localTelnetSocket.on('data', onData);
            localTelnetSocket.on('error', onError);
            localTelnetSocket.write(KAFKA_STREAM_COMMAND + "\n", UTF8_FORMAT);
        };

        localSocket.on('connect', onConnect);
        localSocket.on('error', onError);
    } catch (err) {
        console.error("❌ Error in startKafkaStream:", err);
        return res.status(500).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};

const stopKafkaStream = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host && connection.port)) {
        return res.status(404).send(connection);
    }

    try {
        const topicName = String(req.body?.topicName ?? '').trim();
        const stopCommand = topicName
            ? `${STOP_KAFKA_STREAM_COMMAND}|${topicName}`
            : STOP_KAFKA_STREAM_COMMAND;
        const result = await executeTelnetCommand(connection, stopCommand, TIMEOUT.default * 2);
        const normalizedOutput = String(result ?? '').trim();
        
        return res.status(200).send({
            message: normalizedOutput || "Kafka streaming stopped successfully",
        });
    } catch (err) {
        console.error("Error in stopKafkaStream:", err);
        return res.status(500).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};

export const constructKG = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(404).send(connection);
    }
    const clusterId = req.header('Cluster-ID');
    const {
        hdfsIp,
        hdfsPort,
        hdfsFilePath,
        llmRunnerString,         // [{ runner: string, chunks: number }]
        inferenceEngine,
        model,
        chunkSize,
        status,
        graphId
    } = req.body;

    try {
        telnetConnection({ host: connection.host, port: connection.port })(() => {
            let commandOutput = "";

            tSocket.on("data", async (buffer) => {
                const msg = buffer.toString(UTF8_FORMAT).trim();
                console.log("Master:", msg);
                commandOutput += msg + "\n";

                if (msg.includes("Do you want to use the default HDFS server")) {

                    console.log("sending n")
                    tSocket.write("n\n");

                } else if (msg.includes("HDFS Server IP:")) {
                    console.log("IP:", hdfsIp);
                    tSocket.write(hdfsIp.toString(UTF8_FORMAT).trim() + "\n");
                } else if (msg.includes("HDFS Server Port:")) {
                    console.log("port:", hdfsPort.toString().toString(UTF8_FORMAT).trim() + "\n");
                    tSocket.write(hdfsPort.toString().toString(UTF8_FORMAT).trim() + "\n");
                } else if (msg.includes("HDFS file path:")) {
                    tSocket.write(hdfsFilePath.toString(UTF8_FORMAT).trim() + "\n");
                } else if (msg.includes("There exists a graph with the file path")) {
                    if (status === "paused") {
                        tSocket.write("y\n"); // or "n" depending on user choice

                    } else {
                        tSocket.write("n\n"); // or "n" depending on user choice

                    }
                } else if (msg.includes("Graph Id to resume?")) {

                    tSocket.write(graphId.toString(UTF8_FORMAT).trim() + "\n");
                } else if (msg.includes("LLM runner hostname:port:")) {
                    if (llmRunnerString == null) {
                        // If llmRunnerString is null, the UI has sent this request to validate the reachability of
                        // HDFS file system from the jasminegraph cluster, hence we return 200
                        console.log("ending telnet connection")
                        tSocket.write("exit\n");
                        res.status(HTTP[200]).send({message: "HDFS is reachable from the cluster"});

                    } else {
                        tSocket.write(llmRunnerString.toString(UTF8_FORMAT).trim() + "\n");

                    }
                } else if (msg.includes("LLM inference engine?")) {
                    tSocket.write(inferenceEngine.toString(UTF8_FORMAT).trim() + "\n");
                } else if (msg.includes("What is the LLM you want to use?")) {
                    if (model == null) {
                        // If model is null, the UI has sent this request to validate the reachability of the LLM
                        // inference engine from the jasminegraph cluster, hence we return 200
                        console.log("ending telnet connection")
                        tSocket.write("exit\n");

                        res.status(HTTP[200]).send({message: "LLM is reachable from the cluster"});
                    } else {
                        tSocket.write(model.toString(UTF8_FORMAT).trim() + "\n");

                    }
                } else if (msg.includes("chunk size")) {
                    tSocket.write(chunkSize.toString().toString(UTF8_FORMAT).trim() + "\n");
                } else if (msg.includes("Graph Id")) {
                    const graphId = msg.split(":")[1].trim()
                    tSocket.write("exit\n");
                    if (status === "paused") {
                        await updateKGConstructionMetaStatusRepo(
                            Number(graphId),
                            "running"
                        );
                    } else {
                        await createKGConstructionMetaRepo({
                            user_id: "",
                            graph_id: graphId,
                            hdfs_ip: hdfsIp,
                            hdfs_port: hdfsPort,
                            hdfs_file_path: hdfsFilePath,
                            llm_runner_string: llmRunnerString,
                            inference_engine: inferenceEngine,
                            model,
                            chunk_size: chunkSize,
                            status: "running",
                            message: "Knowledge Graph construction initiated",
                            cluster_id: clusterId!
                        });
                    }

                    console.log("KG extraction started");
                    res.status(HTTP[200]).send({message: "Knowledge Graph construction Started"});
                }
                else if(msg.includes("HDFS file System Not reachable.")) {
                    res.status(HTTP[400]).send({message: msg});

                } else if(msg.includes("Could not connect")) {
                res.status(HTTP[400]).send({message: msg});

            }  else if(msg.includes("The provided HDFS path is invalid.")) {
                res.status(HTTP[400]).send({message: msg});

            }
            });

            // Kick off by sending constructkg
            tSocket.write(CONSTRUCT_KG_COMMAND + "\n");
        });
    } catch (err) {
        console.error("❌ Error in constructKG:", err);
        return res.status(HTTP[500]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};


export const constructKGTXT = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host && connection.port)) {
        return res.status(404).send(connection);
    }

    if (!req.file) {
        return res.status(400).json({error: "No file uploaded"});
    }
    let customName = path.basename(req.body.textFileName);
// Strict whitelist validation
    const validNameRegex = /^[A-Za-z0-9_.-]+$/;

    if (!customName || !validNameRegex.test(customName) || customName.includes("..")) {
        return res.status(400).json({ error: "Invalid file name" });
    }
   
    if (!customName) {
        return res.status(400).json({error: "Missing text file name"});
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== PDF_EXTENSION && ext !== TXT_EXTENSION) {
        return res.status(400).json({error: "Only .txt or .pdf allowed"});
    }

    const finalFileName = customName + ext;
    const finalPath = path.join(CACHE_DIR, finalFileName);

    if (fs.existsSync(finalPath)) {
        console.log("Duplicate file found:", finalFileName);

        let existingContent = "";

        if (ext === ".txt") {
            existingContent = fs.readFileSync(finalPath, UTF8_FORMAT);
        } else {
            const pdfData = fs.readFileSync(finalPath);
            const parsed = await pdfParse(pdfData);
            existingContent = parsed.text;

        }

        return res.json({
            status: "duplicate",
            filename: finalFileName,
            extractedText: existingContent
        });
    }

    // ----------------------------------------------------
    // STEP B: MOVE FILE FROM TMP → UPLOADS
    // ----------------------------------------------------
    // STEP B: MOVE FILE FROM TMP → UPLOADS
    try {
        // Ensure the tmp file exists
        const tmpStats = await fs.promises.lstat(req.file.path);

        // Optional: prevent symlinks (lstat vs stat)
        if (tmpStats.isSymbolicLink()) {
            return res.status(400).json({ error: "Invalid file upload" });
        }

        // Atomic move
        await fs.promises.rename(req.file.path, finalPath);

        // Optional: set strict permissions on uploaded file
        await fs.promises.chmod(finalPath, 0o600);
    } catch (err) {
        console.error("File move failed:", err);
        // Attempt cleanup if tmp still exists
        try { await fs.promises.unlink(req.file.path); } catch {}
        return res.status(500).json({ error: "Failed to save uploaded file" });
    }
    // ----------------------------------------------------
    // STEP C: TEXT EXTRACTION
    // ----------------------------------------------------
    let extractedText = "";

    if (ext === ".txt") {
        extractedText = fs.readFileSync(finalPath, UTF8_FORMAT);
    } else {
        const pdfBuffer = fs.readFileSync(finalPath);
        const parsed = await pdfParse(pdfBuffer);
        extractedText = parsed.text;
    }

    const textFilePath = path.join(CACHE_DIR, customName + ".txt");
    fs.writeFileSync(textFilePath, extractedText, UTF8_FORMAT);
    const {
        llmRunnerString,    // "host:port"
        inferenceEngine,    // "ollama" | "vllm"
        model,              // model name
        chunkSize,          // bytes
    } = req.body;
    const downloadURI =  HOST + ":" +PORT + "/public/" + customName + ".txt" ;
    console.log("downloadURI:", downloadURI);

    try {
        telnetConnection({ host: connection.host, port: connection.port })(() => {
            let completed = false;

            tSocket.on("data", async (buffer) => {
                const msg = buffer.toString(UTF8_FORMAT).trim();
                console.log("Master:", msg);

                /* 1. Local file path */
                if (msg.includes("Local TXT file absolute path")) {
                    tSocket.write(downloadURI.trim() + "\n");
                }

                /* 2. LLM runner */
                else if (msg.includes("LLM runner hostname:port")) {
                    tSocket.write(llmRunnerString.trim() + "\n");
                }

                /* 3. Inference engine */
                else if (msg.includes("LLM inference engine")) {
                    tSocket.write(inferenceEngine.trim() + "\n");
                }

                /* 4. Model name */
                else if (msg.includes("LLM model name")) {
                    tSocket.write(model.trim() + "\n");
                }

                /* 5. Chunk size */
                else if (msg.includes("Chunk size")) {
                    tSocket.write(chunkSize.toString().trim() + "\n");
                }

                /* 6. Final Graph ID */
                else if (msg.startsWith("Graph Id:")) {
                    const newGraphId = msg.split(":")[1].trim();
                    completed = true;
                    tSocket.write("exit\n");
                    res.status(200).send({
                        message: "Knowledge Graph construction started",
                        graphId: newGraphId
                    });
                }

                /* Error handling from C++ */
                else if (
                    msg.includes("Invalid local file path") ||
                    msg.includes("Socket write failed")
                ) {
                    tSocket.write("exit\n");
                    return res.status(400).send({
                        code: ErrorCode.ServerError,
                        message: msg
                    });
                }
            });


            tSocket.write(CONSTRUCT_KG_COMMAND_LOCAL + "\n");
        });
    } catch (err) {
        console.error("❌ Knowledge graph construction failed: ", err);
        return res.status(500).send({
            code: ErrorCode.ServerError,
            message: ErrorMsg.ServerError,
            errorDetails: err
        });
    }
};


export const stopConstructKG = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(404).send(connection);
    }
    const clusterId = req.header("Cluster-ID");
    const { graphId, status } = req.body;

    try {
        telnetConnection({ host: connection.host, port: connection.port })(() => {
            let commandOutput = "";
            req.setTimeout(0);
            tSocket.on("data", async (buffer) => {
                const msg = buffer.toString(UTF8_FORMAT).trim();
                commandOutput += msg + "\n";

                if (msg.includes("done")) {
                    tSocket.write("exit\n");
                    console.log("✅ KG extraction stopped successfully");
                    res.status(200).send({ message: "Knowledge Graph construction Stopped" });
                }
            });

            tSocket.write(STOP_CONSTRUCT_KG_COMMAND + "\n");
        });
    } catch (err) {
        console.error("❌ Error in stopConstructKG:", err);
        return res
            .status(500)
            .send({ code: 500, message: "Server error", errorDetails: err });
    }
};

export const getKGConstructionMetaByGraphId = async (
    req: Request,
    res: Response
) => {
    const { graphId } = req.query;
    const clusterId = req.header("Cluster-ID");

    try {
        const metaData = await getKGConstructionMetaByClusterRepo(Number(clusterId));
        const filtered = metaData.filter((m) => m.graph_id === graphId);

        if (!filtered.length) {
            return res.status(404).json({
                message: `No KG construction metadata found for clusterId: ${clusterId} and graphId: ${graphId}`,
            });
        }

        return res.status(200).json({ data: filtered });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message:
                "Internal Server Error: Unable to fetch KG Construction Metadata for the given cluster and file path.",
            error: err instanceof Error ? err.message : "Unknown error occurred",
        });
    }
};

export const getOnProgressKGConstructionMeta = async (
    req: Request,
    res: Response
) => {
    const clusterId = req.header("Cluster-ID");

    try {
        const metaData = await getKGConstructionMetaByClusterRepo(Number(clusterId));
        const running = metaData.filter((m) => m.status === "running");
        const result = running.map((dbRow) => ({
            userId: dbRow.user_id,
            graphId: dbRow.graph_id,
            hdfsIp: dbRow.hdfs_ip,
            hdfsPort: dbRow.hdfs_port,
            hdfsFilePath: dbRow.hdfs_file_path,
            llmRunnerString: dbRow.llm_runner_string,
            inferenceEngine: dbRow.inference_engine,
            model: dbRow.model,
            chunkSize: dbRow.chunk_size,
            status: dbRow.status,
            message: dbRow.message,
            clusterId: dbRow.cluster_id,
        }));

        return res.status(200).json({ data: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message:
                "Internal Server Error: Unable to fetch KG Construction Metadata for the given cluster and file path.",
            error: err instanceof Error ? err.message : "Unknown error occurred",
        });
    }
};

export const updateKGConstructionMetaByClusterId = async (
    req: Request,
    res: Response
) => {
    const { clusterId, hdfsFilePath } = req.params;
    const updateData = req.body;

    try {
        const metaData = await getKGConstructionMetaByClusterRepo(Number(clusterId));
        const target = metaData.find((m) => m.hdfs_file_path === hdfsFilePath);

        if (!target) {
            return res.status(404).json({
                message: `No KG construction metadata found for clusterId: ${clusterId} and hdfsFilePath: ${hdfsFilePath}`,
            });
        }

        const updated = await updateKGConstructionMetaStatusRepo(
            target.id,
            updateData.status as KGStatus,
            updateData.message
        );

        return res.status(200).json({
            message: "KG Construction Metadata updated successfully",
            data: updated,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message:
                "Internal Server Error: Unable to update KG Construction Metadata for the given cluster and file path.",
            error: err instanceof Error ? err.message : "Unknown error occurred",
        });
    }
};

const removeGraph = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(404).send(connection);
    }
    try {
        telnetConnection({host: connection.host, port: connection.port})(() => {
            let commandOutput = '';

            tSocket.on('data', (buffer) => {
                commandOutput += buffer.toString(UTF8_FORMAT);
            });

            // Write the command to the Telnet server
            tSocket.write(GRAPH_REMOVE_COMMAND + '|' + req.params.id + '\n', UTF8_FORMAT, () => {
                setTimeout(() => {
                    if (commandOutput) {
                        return res.status(HTTP[200]).send(commandOutput);
                    } else {
                        return res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
                    }
                }, TIMEOUT.default); // Adjust timeout to wait for the server response if needed
            });
        });
    } catch (err) {
        return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};

const getDataFromHadoop = async (req: Request, res: Response) => {

    const { ip, port } = req.query;
    if (!ip || !port) {
        return res.status(400).json({ error: 'Missing ip or port parameter' });
    }
    try {
        const hadoopUrl = `http://${ip}:${port}/webhdfs/v1/home?op=LISTSTATUS`;
        const response = await fetch(hadoopUrl);
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from Hadoop' });
        }
        const data = await response.json();
        data.FileStatuses.FileStatus = data.FileStatuses.FileStatus.map((file) => file.pathSuffix);
        res.status(200).json(data.FileStatuses.FileStatus);
    } catch (err) {
        res.status(500).json({ error: 'Error connecting to Hadoop', details: err });
    }
};

const validateHDFS = async (req: Request, res: Response) => {
    const { ip, port, filePath } = req.body; // POST body
    if (!ip || !port || !filePath) {
        return res.status(400).json({ error: 'Missing ip, port, or filePath' });
    }

    try {
        // Encode path for URL
        const encodedPath = encodeURIComponent(filePath);
        const hadoopUrl = `http://${ip}:9870/webhdfs/v1${filePath}?op=GETFILESTATUS`;

        const response = await fetch(hadoopUrl);

        if (response.status === 200) {
            const data = await response.json();
            if (data?.FileStatus) {
                return res.status(200).json({ exists: true, fileStatus: data.FileStatus });
            } else {
                return res.status(404).json({ exists: false, message: 'File not found' });
            }
        } else if (response.status === 404) {
            return res.status(404).json({ exists: false, message: 'File not found' });
        } else {
            return res.status(response.status).json({ exists: false, message: 'Error fetching file' });
        }

    } catch (err) {
        console.error('HDFS validation error:', err);
        return res.status(500).json({ exists: false, error: 'Error connecting to HDFS', details: err });
    }
};

const constructKGHadoop = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(404).send(connection);
    }
    try {
        telnetConnection({host: connection.host, port: connection.port})(() => {
            let commandOutput = '';

            tSocket.on('data', (buffer) => {
                commandOutput += buffer.toString(UTF8_FORMAT);
            });

            // Write the command to the Telnet server
            tSocket.write(LIST_COMMAND + '\n', UTF8_FORMAT, () => {
                setTimeout(() => {
                    if (commandOutput) {
                        try {
                            res.status(HTTP[200]).send(JSON.parse(commandOutput));

                        } catch (err) {
                            return res.status(HTTP[500]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
                        }                    } else {
                        res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
                    }
                }, TIMEOUT.default); // Adjust timeout to wait for the server response if needed
            });
        });
    } catch (err) {
        return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};

const triangleCount = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(HTTP[404]).send(connection);
    }
    const { priority, graph_id } = req.body;
    try {
        telnetConnection({host: connection.host, port: connection.port})(() => {
            let commandOutput = '';

            tSocket.on('data', (buffer) => {
                commandOutput += buffer.toString(UTF8_FORMAT);
            });

            // Write the command to the Telnet server
            tSocket.write(TRIANGLE_COUNT_COMMAND + '|' + graph_id + '|' + priority + '\n', UTF8_FORMAT, () => {
                setTimeout(() => {
                    if (commandOutput) {
                        res.status(HTTP[200]).send(commandOutput);
                    } else {
                        res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
                    }
                }, TIMEOUT.default); // Adjust timeout to wait for the server response if needed
            });
        });
    } catch (err) {
        return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};

const getGraphVisualization = async (req, res) => {
    const id = req.query.id as string;
    const filePath = `./src/script/sample/graph_dataset${id}.json`;

    try{
        const graph = parseGraphFile(filePath);
        return res.status(HTTP[200]).send({data: graph})
    } catch (err){
        return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
}

const getGraphData = async (req, res) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(404).send(connection);
    }
    try {
        telnetConnection({host: connection.host, port: connection.port})(() => {
            let commandOutput = '';

            tSocket.on('data', (buffer) => {
                commandOutput += buffer.toString(UTF8_FORMAT);
            });

            // Write the command to the Telnet server
            tSocket.write(GRAPH_DATA_COMMAND + '\n', UTF8_FORMAT, () => {
                setTimeout(() => {
                    if (commandOutput) {
                        try {
                            res.status(HTTP[200]).send(JSON.parse(commandOutput));

                        } catch (err) {
                            return res.status(HTTP[500]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
                        }                    } else {
                        res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
                    }
                }, TIMEOUT.hundred); // Adjust timeout to wait for the server response if needed
            });
        });
    } catch (err) {
        return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
}
export const createKafkaStreamConfig = async (req: Request, res: Response) => {
    const clusterId = req.header('Cluster-ID');
    if (!clusterId) {
        return res.status(400).send({ message: 'Cluster-ID header is required' });
    }
    const {
        topicName, graphId, isExistingGraph, useDefaultGraphId,
        partitionAlgorithm, partitionAlgorithmLabel, isDirected, graphTypeLabel,
        useDefaultKafka, kafkaConfigPath, kafkaBroker, groupId, offsetReset,
    } = req.body;
    if (!topicName) {
        return res.status(400).send({ message: 'topicName is required' });
    }
    try {
        const config = await createKafkaStreamConfigRepo({
            topic_name: topicName,
            graph_id: graphId ?? null,
            is_existing_graph: !!isExistingGraph,
            use_default_graph_id: useDefaultGraphId ?? null,
            partition_algorithm: partitionAlgorithm ?? null,
            partition_algorithm_label: partitionAlgorithmLabel ?? null,
            is_directed: isDirected ?? null,
            graph_type_label: graphTypeLabel ?? null,
            use_default_kafka: useDefaultKafka !== false,
            kafka_config_path: kafkaConfigPath ?? null,
            kafka_broker: kafkaBroker ?? null,
            group_id: groupId ?? null,
            offset_reset: offsetReset ?? null,
            stream_status: 'active',
            cluster_id: clusterId,
        });
        return res.status(201).send({ data: config });
    } catch (err: any) {
        return res.status(500).send({ message: 'Failed to save Kafka stream config', errorDetails: err?.message || err });
    }
};

export const getKafkaStreamConfigs = async (req: Request, res: Response) => {
    const clusterId = req.header('Cluster-ID');
    if (!clusterId) {
        return res.status(400).send({ message: 'Cluster-ID header is required' });
    }
    try {
        const configs = await getKafkaStreamConfigsByClusterRepo(clusterId);
        return res.status(200).send({ data: configs });
    } catch (err: any) {
        return res.status(500).send({ message: 'Failed to fetch Kafka stream configs', errorDetails: err?.message || err });
    }
};

export const updateKafkaStreamConfigStatus = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send({ message: 'Valid id param is required' });
    }
    const { status, graphId } = req.body;
    const allowedStatuses: KafkaStreamConfigStatus[] = ['active', 'paused', 'terminated'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).send({ message: `status must be one of: ${allowedStatuses.join(', ')}` });
    }
    try {
        const updated = await updateKafkaStreamConfigStatusRepo(id, status, graphId);
        if (!updated) {
            return res.status(404).send({ message: 'Kafka stream config not found' });
        }
        return res.status(200).send({ data: updated });
    } catch (err: any) {
        return res.status(500).send({ message: 'Failed to update Kafka stream config status', errorDetails: err?.message || err });
    }
};

export { getGraphList, uploadGraph, startKafkaStream, stopKafkaStream, getKafkaTopics, removeGraph, triangleCount, getGraphVisualization, getGraphData, getClusterProperties, getDataFromHadoop ,constructKGHadoop , validateHDFS};
