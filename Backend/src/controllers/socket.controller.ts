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

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import readline from 'readline';
import WebSocket from 'ws';
import { HTTP, TIMEOUT, UTF8_FORMAT } from '../constants/constants';
import { ErrorCode, ErrorMsg } from '../constants/error.constants';
import {
    CYPHER_COMMAND,
    INDEGREE_COMMAND, NO_OF_FIELDS_IN_UPBYTES_CMD,
    OUTDEGREE_COMMAND,
    SEMANTIC_BEAM_SEARCH_COMMAND
} from '../constants/frontend.server.constants';
import { getClusterDetails, IConnection, telnetConnection } from "./graph.controller";
import { getClusterByIdRepo } from '../repository/cluster.repository';

let clients: Map<string, WebSocket> = new Map(); // Map of client IDs to WebSocket connections

export const setupWebSocket = (server: any) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    // Assign a unique ID to each client
    const clientId = uuidv4();
    console.log(`Client connected: ${clientId}`);
    clients.set(clientId, ws);

    ws.send(JSON.stringify({ type: 'CONNECTED', clientId })); // Send client ID to the client

    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);
      clients.delete(clientId);
    });

    ws.on('message', (message) => {
      const data = JSON.parse(message.toString());
      // Handle messages from clients
      if (data.type === 'REQUEST_GRAPH') {
        streamGraphVisualization(data.clientId, data.graphFilePath);
      }

      if (data.type === 'QUERY') {
        streamQueryResult(data.clientId, data.clusterId, data.graphId, data.query);
      }
        if (data.type === 'SBS') {
            semanticBeamSearch(data.clientId, data.clusterId, data.graphId, data.query);
        }

        if (data.type === 'UPBYTES') {
            streamUploadBytes(data.clientId, data.clusterId, data.graphIds);
        }

        if (data.type === 'STOP') {
            stopStream(data.clientId, data.clusterId);
        }
      if (data.type === "GRAPH_DEGREE") {
        getDegreeData(data.clientId, data.clusterId, data.graphId, data.degree_type)
      }
    });
  });
};

export const sendToClient = (clientId, data) => {
  const client = clients.get(clientId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  } else {
      clients.delete(clientId);
    console.error(`Client ${clientId} not connected or WebSocket not open.`);
  }
};

const streamGraphVisualization = async (clientId: string, filePath: string) => {
  const client = clients.get(clientId);

  if (!client || client.readyState !== WebSocket.OPEN) {
    console.error(`Client ${clientId} not connected or unavailable`);
    return;
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const [from, to] = line.split(' ').map(Number); // Parse line

      const nodeData = {
        action: 'add',
        nodes: [
          { id: from, label: `Node ${from}` },
          { id: to, label: `Node ${to}` },
        ],
        edges: [{ from, to }],
      };

      // Send data only to the specific client
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(nodeData));
      }
    }
  } catch (err) {
    console.error(`Error streaming graph data to client ${clientId}:`, err);
  }
};

const streamQueryResult = async (clientId: string, clusterId:string, graphId:string, query: string) => {
    const cluster = await getClusterByIdRepo(Number(clusterId));
  if (!(cluster?.host || cluster?.port)) {
    sendToClient(clientId, { Error: "cluster not found"})
    return
  }

  const connection: IConnection = {
    host: cluster.host,
    port: cluster.port
  }

  let sharedBuffer: string[] = [];

  const producer = async () => {
    var remaining: string = '';

    while(true){
      if(sharedBuffer.length > 0){
        remaining += sharedBuffer.shift()!

        let splitIndex;

        if(remaining.trim() == '-1'){
            sendToClient(clientId, {"done":"true"})
          console.log("Termination signal received. Closing Telnet connection.");
          return
        }

        // Extract complete JSON objects from the buffer
        while ((splitIndex = remaining.indexOf('\n')) !== -1) {
          const jsonString = remaining.slice(0, splitIndex).trim(); // Extract a complete object
          remaining = remaining.slice(splitIndex + 1); // Remove processed part

          if (jsonString) {
            if (jsonString == "-1") {
              console.log("Termination signal received. Closing Telnet connection.");
                sendToClient(clientId, {"done":"true"})
              return; // Exit the producer loop
            }

            try {
              const parsed = JSON.parse(jsonString); // Parse the JSON
              sendToClient(clientId, parsed)
            } catch (error) {
              console.error('Error parsing JSON:', error, 'Data:', jsonString);
            }
          }


          if(remaining.trim() == '-1' || jsonString == '-1'){
            console.log("Termination signal received. Closing Telnet connection.");
              sendToClient(clientId, {"done":"true"})
            return
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, TIMEOUT.hundred));
    }
  }

  try {
    telnetConnection({host: connection.host, port: connection.port})((tSocket: any) => {
      producer();

      tSocket.on('data', (buffer) => {
        sharedBuffer.push(buffer.toString(UTF8_FORMAT))
      });

      tSocket.on('end', () => {
        console.log('Telnet connection ended');
      });

      // Write the command to the Telnet server
      tSocket.write(CYPHER_COMMAND + '|' + graphId + '|' + query + '\n', UTF8_FORMAT);
    });
  } catch (err) {
    return console.log({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
  }
}
const semanticBeamSearch = async (clientId: string, clusterId:string, graphId:string, query: string) => {
    const cluster = await getClusterByIdRepo(Number(clusterId));
    if (!(cluster?.host || cluster?.port)) {
        sendToClient(clientId, { Error: "cluster not found"})
        return
    }

    const connection: IConnection = {
        host: cluster.host,
        port: cluster.port
    }

    let sharedBuffer: string[] = [];

    const producer = async () => {
        var remaining: string = '';

        while(true){
            if(sharedBuffer.length > 0){
                remaining += sharedBuffer.shift()!

                let splitIndex;

                if(remaining.trim() == '-1'){
                    console.log("Termination signal received. Closing Telnet connection.");
                    sendToClient(clientId, { "done":"true"})

                    return
                }

                // Extract complete JSON objects from the buffer
                while ((splitIndex = remaining.indexOf('\n')) !== -1) {
                    const jsonString = remaining.slice(0, splitIndex).trim(); // Extract a complete object
                    remaining = remaining.slice(splitIndex + 1); // Remove processed part

                    if (jsonString) {
                        if (jsonString == "-1") {
                            sendToClient(clientId, { "done":"true"})

                            console.log("Termination signal received. Closing Telnet connection.");
                            return; // Exit the producer loop
                        }

                        try {
                            const parsed = JSON.parse(jsonString); // Parse the JSON
                            sendToClient(clientId, parsed)
                        } catch (error) {
                            console.error('Error parsing JSON:', error, 'Data:', jsonString);
                        }
                    }


                    if(remaining.trim() == '-1' || jsonString == '-1'){
                        console.log("Termination signal received. Closing Telnet connection.");
                        sendToClient(clientId, { "done":"true"})

                        return
                    }
                }
            }

            await new Promise((resolve) => setTimeout(resolve, TIMEOUT.hundred));
        }
    }

    try {
        telnetConnection({host: connection.host, port: connection.port})((tSocket: any) => {
            producer();

            tSocket.on('data', (buffer) => {
                sharedBuffer.push(buffer.toString(UTF8_FORMAT))
            });

            tSocket.on('end', () => {
                console.log('Telnet connection ended');
            });

            // Write the command to the Telnet server
            tSocket.write(SEMANTIC_BEAM_SEARCH_COMMAND + '|' + graphId + '|' + query + '\n', UTF8_FORMAT);
        });
    } catch (err) {
        return console.log({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
}


const streamUploadBytes = async (clientId: string, clusterId: string, graphIds: string[]) => {
    const cluster = await getClusterByIdRepo(Number(clusterId));
    if (!(cluster?.host || cluster?.port)) {
        sendToClient(clientId, { Error: "cluster not found" });
        return;
    }

    const connection: IConnection = {
        host: cluster.host,
        port: cluster.port
    };

    let sharedBuffer: string[] = [];
    let stopRequested = false; // flag to stop producer when client disconnects

    const producer = async () => {
        let remaining = '';

        while (true) {
            // 🛑 Check if client still connected
            const client = clients.get(clientId);
            if (!client || client.readyState !== WebSocket.OPEN || stopRequested) {
                console.log(`Stopping UPBYTES producer for disconnected client: ${clientId}`);
                return;
            }

            if (sharedBuffer.length > 0) {
                remaining += sharedBuffer.shift()!;
                let splitIndex;

                while ((splitIndex = remaining.indexOf('\n')) !== -1) {
                    const line = remaining.slice(0, splitIndex).trim();
                    remaining = remaining.slice(splitIndex + 1);

                    if (!line) continue;

                    if (line === "-1") {
                        console.log(`Termination signal received. Closing Telnet connection for ${clientId}.`);
                        return;
                    }

                    if (line.startsWith("UPBYTES")) {
                        const parts = line.split('|');
                        let updates: {
                            graphId: string;
                            uploaded: number;
                            total: number;
                            percentage: number;
                            bytesPerSecond: number;
                            triplesPerSecond: number;
                            startTime: string;
                            uploadPath: string;
                            llmRunnerString: string;
                            inferenceEngine: string;
                            model:string;
                            chunkSize:number;
                            kgConstructionStatus:string;
                            hdfsIp:string;
                            hdfsPort:string;

                        }[] = [];
                        for (let i = 1; i < parts.length; i += NO_OF_FIELDS_IN_UPBYTES_CMD) {
                            const slice = parts.slice(i, i + NO_OF_FIELDS_IN_UPBYTES_CMD).map((p) => (p ?? '').trim());

                            // Validate we have the expected number of fields for one UPBYTES record
                            if (slice.length < NO_OF_FIELDS_IN_UPBYTES_CMD) {
                                console.warn(`Malformed UPBYTES message: expected ${NO_OF_FIELDS_IN_UPBYTES_CMD} fields, got ${slice.length}`, parts);
                                break;
                            }
                            const graphId = parts[i];
                            const uploaded = parseFloat(parts[i + 1] || "0");
                            const total = parseFloat(parts[i + 2] || "0");
                            const percentage = parseFloat(total > 0 ? ((uploaded / total) * 100).toFixed(5) : "0.00");
                            const bytesPerSecond = parseFloat(parts[i + 4] || "0");
                            const triplesPerSecond = parseFloat(parts[i + 5] || "0");
                            const startTime = parts[i + 6];
                            const uploadPath = parts[i + 7];
                            const llmRunnerString  = parts[i+8];
                            const inferenceEngine = parts[i+9];
                            const model = parts[i+10];
                            const chunkSize =parseInt(parts[i+11]);
                            const kgConstructionStatus = parts[i+12];
                            const hdfsIp = parts[i+13];
                            const hdfsPort = parts[i+14];

                            updates.push({ graphId, uploaded, total, percentage, bytesPerSecond, triplesPerSecond, startTime, uploadPath, llmRunnerString, inferenceEngine, model, chunkSize, kgConstructionStatus, hdfsIp, hdfsPort});
                        }
                        updates = updates.reverse();
                        // Send updates only if still connected
                        if (client.readyState === WebSocket.OPEN) {
                            sendToClient(clientId, {
                                type: "UPBYTES",
                                updates,
                                timestamp: Date.now(),
                            });
                        }
                    }
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    };

    try {
        telnetConnection({ host: connection.host, port: connection.port })((tSocket: any) => {
            producer();

            tSocket.on('data', (buffer) => {
                sharedBuffer.push(buffer.toString(UTF8_FORMAT));
            });

            tSocket.on('end', () => {
                console.log(`Telnet connection ended for ${clientId}`);
            });

            // Handle cleanup if client disconnects
            const client = clients.get(clientId);
            if (client) {
                client.on('close', () => {
                    console.log(`Client ${clientId} disconnected — stopping UPBYTES stream.`);
                    stopRequested = true;
                    tSocket.end();
                });
                client.on('error', () => {
                    console.log(`Client ${clientId} errored — stopping UPBYTES stream.`);
                    stopRequested = true;
                    tSocket.end();
                });
            }

            // Build subscription command
            const command = ['UPBYTES', ...graphIds].join('|');
            tSocket.write(command + '\n', UTF8_FORMAT);
        });
    } catch (err) {
        console.error({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};


const stopStream = async (clientId: string, clusterId: string) => {
    const cluster = await getClusterByIdRepo(Number(clusterId));
    if (!(cluster?.host || cluster?.port)) {
        sendToClient(clientId, { Error: "cluster not found"});
        return;
    }

    const connection: IConnection = {
        host: cluster.host,
        port: cluster.port
    };


    try {
        telnetConnection({ host: connection.host, port: connection.port })((tSocket: any) => {

            tSocket.on('end', () => {
                console.log('Telnet connection ended');
            });

            // Build subscription command
            const command = 'STOP'
            tSocket.write(command + '\n', UTF8_FORMAT);
        });
    } catch (err) {
        console.error({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
    }
};


const getDegreeData = async (clientId: string, clusterId:string, graphId:string, type: string) => {
  const COMMAND = type == "in_degree" ? INDEGREE_COMMAND : type == "out_degree" ? OUTDEGREE_COMMAND : INDEGREE_COMMAND;   
  
  const cluster = await getClusterByIdRepo(Number(clusterId));
  if (!cluster || !cluster.host || !cluster.port) {
    sendToClient(clientId, { Error: "cluster not found" })
    return;
  }

  const connection: IConnection = {
    host: cluster.host,
    port: cluster.port
  }

  let sharedBuffer: string[] = [];

  const producer = async () => {
    var remaining: string = '';

    while(true){
      if(sharedBuffer.length > 0){
        remaining += sharedBuffer.shift()!
        
        let splitIndex;

        if(remaining.trim() == '-1'){
          sendToClient(clientId, { graphId, degree_type: type, type: "FINISHED" })
          console.log("Termination signal received. Closing Telnet connection.");
          return
        }
        
        // Extract complete JSON objects from the buffer
        while ((splitIndex = remaining.indexOf('\n')) !== -1) {
          const jsonString = remaining.slice(0, splitIndex).trim(); // Extract a complete object
          remaining = remaining.slice(splitIndex + 1); // Remove processed part
          
          if (jsonString) {
            if (jsonString == "-1") {
              sendToClient(clientId, { graphId, degree_type: type, type: "FINISHED" })
              console.log("Termination signal received. Closing Telnet connection.");
              return; // Exit the producer loop
            }
            
            try {
              const parsed = JSON.parse(jsonString); // Parse the JSON
              sendToClient(clientId, {...parsed, type})
            } catch (error) {
              console.error('Error parsing JSON:', error, 'Data:', jsonString);
            }
          }


          if(remaining.trim() == '-1' || jsonString == '-1'){
            sendToClient(clientId, { graphId, degree_type: type, type: "FINISHED" })
            console.log("Termination signal received. Closing Telnet connection.");
            return
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, TIMEOUT.hundred));
    }
  }

  try {
    telnetConnection({host: connection.host, port: connection.port})((tSocket: any) => {
      producer();

      tSocket.on('data', (buffer) => {
        sharedBuffer.push(buffer.toString(UTF8_FORMAT))
      });

      tSocket.on('end', () => {
        console.log('Telnet connection ended');
      });

      // Write the command to the Telnet server
      tSocket.write(COMMAND + '|' + graphId + '\n', UTF8_FORMAT);
    });
  } catch (err) {
    return console.log({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
  }
}
