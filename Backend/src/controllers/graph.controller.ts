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
import { Request, Response } from 'express';
import { GRAPH_REMOVE_COMMAND,
    GRAPH_UPLOAD_COMMAND,
    GRAPH_DATA_COMMAND,
    LIST_COMMAND,
    TRIANGLE_COUNT_COMMAND,
    PROPERTIES_COMMAND,
    STOP_CONSTRUCT_KG_COMMAND,
    CONSTRUCT_KG_COMMAND} from './../constants/frontend.server.constants';
import { ErrorCode, ErrorMsg } from '../constants/error.constants';
import { getClusterByIdRepo } from '../repository/cluster.repository';
import { HTTP, TIMEOUT } from '../constants/constants';
import { parseGraphFile } from '../utils/graph';
import {
    createKGConstructionMetaRepo,
    getKGConstructionMetaByClusterRepo,
    updateKGConstructionMetaStatusRepo,
    deleteKGConstructionMetaRepo,
    KGStatus
} from "../repository/kg-construction-meta.repository";

export let socket;
export let tSocket;

export type IConnection = {
    host: string;
    port: number;
}

const DEV_MODE = process.env.DEV_MODE === 'true';

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
        });

        socket.on('end', () => {
            console.log('Telnet connection closed');
            socket = undefined; // Reset socket when closed
            tSocket = undefined;
        });
    } else {
        callback(tSocket); // Use existing connection
    }
};

const getGraphList = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(404).send(connection);
    }
    try {
        telnetConnection({host: connection.host, port: connection.port})(() => {
            let commandOutput = '';

            tSocket.on('data', (buffer) => {
                commandOutput += buffer.toString('utf8');
            });

      // Write the command to the Telnet server
      tSocket.write(LIST_COMMAND + '\n', 'utf8', () => {
        setTimeout(() => {
          if (commandOutput) {
            console.log(new Date().toLocaleString() + ' - ' + LIST_COMMAND + ' - ' + commandOutput);
            res.status(HTTP[200]).send(JSON.parse(commandOutput));
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

const getClusterProperties = async (req: Request, res: Response) => {
  const connection = await getClusterDetails(req);
  if (!(connection.host || connection.port)) {
    return res.status(404).send(connection);
  }
  try {
    telnetConnection({host: connection.host, port: connection.port})(() => {
      let commandOutput = '';

      tSocket.on('data', (buffer) => {
        commandOutput += buffer.toString('utf8');
      });

      // Write the command to the Telnet server
      tSocket.write(PROPERTIES_COMMAND + '\n', 'utf8', () => {
        setTimeout(() => {
          if (commandOutput) {
            res.status(HTTP[200]).send(JSON.parse(commandOutput));
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

const uploadGraph = async (req: Request, res: Response) => {
    const connection = await getClusterDetails(req);
    if (!(connection.host || connection.port)) {
        return res.status(404).send(connection);
    }
    const { graphName } = req.body;
    const fileName = req.file?.filename;
    const filePath = DEV_MODE ? "/var/tmp/data/" + fileName : fileName; // Get the file path

    console.log(GRAPH_UPLOAD_COMMAND + '|' + graphName + '|' + filePath + '\n');

    try {
        telnetConnection({host: connection.host, port: connection.port})(() => {
            let commandOutput = "";

            tSocket.on("data", (buffer) => {
                commandOutput += buffer.toString("utf8");
            });
            tSocket.write(GRAPH_UPLOAD_COMMAND + '\n', "utf8", () => {
                setTimeout(() => {
                    if (commandOutput.includes("send")) {
                        commandOutput = "";
                        tSocket.write(graphName + '|' + filePath + '\n', "utf8", () => {
                            setTimeout(() => {
                                if (commandOutput) {
                                    res.status(HTTP[200]).send(commandOutput);
                                } else {
                                    res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
                                }
                            }, TIMEOUT.default); // Adjust timeout to wait for the server response if needed
                        });
                    } else {
                        res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
                    }
                }, TIMEOUT.hundred); // Adjust timeout to wait for the server response if needed
            });

        });
    } catch (err) {
        return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
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
                const msg = buffer.toString("utf8").trim();
                console.log("Master:", msg);
                commandOutput += msg + "\n";

                if (msg.includes("Do you want to use the default HDFS server")) {

                    console.log("sending n")
                    tSocket.write("n\n");

                } else if (msg.includes("HDFS Server IP:")) {
                    console.log("IP:", hdfsIp);
                    tSocket.write(hdfsIp.toString("utf8").trim() + "\n");
                } else if (msg.includes("HDFS Server Port:")) {
                    console.log("port:", hdfsPort.toString().toString("utf8").trim() + "\n");
                    tSocket.write(hdfsPort.toString().toString("utf8").trim() + "\n");
                } else if (msg.includes("HDFS file path:")) {
                    tSocket.write(hdfsFilePath.toString("utf8").trim() + "\n");
                } else if (msg.includes("There exists a graph with the file path")) {
                    if (status === "paused") {
                        tSocket.write("y\n"); // or "n" depending on user choice

                    } else {
                        tSocket.write("n\n"); // or "n" depending on user choice

                    }
                } else if (msg.includes("Graph Id to resume?")) {

                    tSocket.write(graphId.toString("utf8").trim() + "\n");
                } else if (msg.includes("LLM runner hostname:port:")) {
                    tSocket.write(llmRunnerString.toString("utf8").trim() + "\n");
                } else if (msg.includes("LLM inference engine?")) {
                    tSocket.write(inferenceEngine.toString("utf8").trim() + "\n");
                } else if (msg.includes("What is the LLM you want to use?")) {
                    tSocket.write(model.toString("utf8").trim() + "\n");
                } else if (msg.includes("The provided HDFS path is invalid") || msg.includes("not available on") || msg.includes("Could not connect to")) {
                    tSocket.write("exit\n");
                    return res.status(HTTP[400]).send({
                        code: ErrorCode.ServerError,
                        message: ErrorMsg.ServerError,
                        errorDetails: {errorMsg: msg}
                    });

                } else if (msg.includes("chunk size")) {
                    tSocket.write(chunkSize.toString().toString("utf8").trim() + "\n");
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
                    // tSocket.end();
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
                const msg = buffer.toString("utf8").trim();
                commandOutput += msg + "\n";

                if (msg.includes("done")) {
                    tSocket.write("exit\n");

                    if (status === "stopped") {
                        await deleteKGConstructionMetaRepo(Number(graphId));
                    } else {
                        await updateKGConstructionMetaStatusRepo(
                            Number(graphId),
                            status as KGStatus
                        );
                    }

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
                commandOutput += buffer.toString('utf8');
            });

            // Write the command to the Telnet server
            tSocket.write(GRAPH_REMOVE_COMMAND + '|' + req.params.id + '\n', 'utf8', () => {
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
                commandOutput += buffer.toString('utf8');
            });

            // Write the command to the Telnet server
            tSocket.write(LIST_COMMAND + '\n', 'utf8', () => {
                setTimeout(() => {
                    if (commandOutput) {
                        res.status(HTTP[200]).send(JSON.parse(commandOutput));
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
                commandOutput += buffer.toString('utf8');
            });

            // Write the command to the Telnet server
            tSocket.write(TRIANGLE_COUNT_COMMAND + '|' + graph_id + '|' + priority + '\n', 'utf8', () => {
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
                commandOutput += buffer.toString('utf8');
            });

            // Write the command to the Telnet server
            tSocket.write(GRAPH_DATA_COMMAND + '\n', 'utf8', () => {
                setTimeout(() => {
                    if (commandOutput) {
                        res.status(HTTP[200]).send({data: JSON.parse(commandOutput)});
                    } else {
                        res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
                    }
                }, TIMEOUT.hundred); // Adjust timeout to wait for the server response if needed
            });
        });
    } catch (err) {
        return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
}

export { getGraphList, uploadGraph, removeGraph, triangleCount, getGraphVisualization, getGraphData, getClusterProperties, getDataFromHadoop ,constructKGHadoop , validateHDFS};
