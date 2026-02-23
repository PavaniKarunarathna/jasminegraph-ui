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

import { getClusterDetails, telnetConnection, tSocket } from "./graph.controller";
import { CYPHER_AST_COMMAND } from '../constants/frontend.server.constants';
import {HTTP, TIMEOUT, UTF8_FORMAT} from '../constants/constants';
import { ErrorCode, ErrorMsg } from '../constants/error.constants';

const queryHandler = async (req, res) => {
  const connection = await getClusterDetails(req);
  if (!(connection.host || connection.port)) {
    return res.status(404).send(connection);
  }

  let sharedBuffer: string[] = [];

  const producer = async () => {
    var remaining: string = '';

    while(true){
      if(sharedBuffer.length > 0){
        remaining += sharedBuffer.shift()!
        
        let splitIndex;

        // Extract complete JSON objects from the buffer
        while ((splitIndex = remaining.indexOf('\n')) !== -1) {
          const jsonString = remaining.slice(0, splitIndex).trim(); // Extract a complete object
          remaining = remaining.slice(splitIndex + 1); // Remove processed part
          
          if (jsonString) {
            try {
              const parsed = JSON.parse(jsonString); // Parse the JSON
            } catch (error) {
              console.error('Error parsing JSON:', error, 'Data:', jsonString);
            }
          }

          if(remaining.trim() == '-1' || jsonString == '-1'){
            console.log("Skipping processing due to termination signal");
            return
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  try {
    telnetConnection({host: connection.host, port: connection.port})(() => {
      let commandOutput = '';
      producer();

      tSocket.on('data', (buffer) => {
        commandOutput += buffer.toString(UTF8_FORMAT)
        sharedBuffer.push(buffer.toString(UTF8_FORMAT))
      });

      // Write the command to the Telnet server
      tSocket.write(CYPHER_AST_COMMAND + '|1|' + '\n', UTF8_FORMAT, () => {
        setTimeout(() => {
          if (commandOutput) {
            console.log(new Date().toLocaleString() + ' - ' + CYPHER_AST_COMMAND + ' - ' + commandOutput);
            res.status(HTTP[200]).send({data: commandOutput});
          } else {
            res.status(HTTP[400]).send({ code: ErrorCode.NoResponseFromServer, message: ErrorMsg.NoResponseFromServer, errorDetails: "" });
          }
        }, TIMEOUT.default); // Adjust timeout to wait for the server response if needed
      });
    });
  } catch (err) {
    return res.status(HTTP[200]).send({ code: ErrorCode.ServerError, message: ErrorMsg.ServerError, errorDetails: err });
  }
}

export { queryHandler };
