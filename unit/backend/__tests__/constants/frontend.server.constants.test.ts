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

import {
  LIST_COMMAND,
  GRAPH_UPLOAD_COMMAND,
  GRAPH_REMOVE_COMMAND,
  TRIANGLE_COUNT_COMMAND,
  GRAPH_DATA_COMMAND,
  CYPHER_AST_COMMAND,
  CYPHER_COMMAND,
  SEMANTIC_BEAM_SEARCH_COMMAND,
  INDEGREE_COMMAND,
  OUTDEGREE_COMMAND,
  PROPERTIES_COMMAND,
  UPLOAD_FROM_HDFS,
  CONSTRUCT_KG_COMMAND,
  STOP_CONSTRUCT_KG_COMMAND
} from '../../../../Backend/src/constants/frontend.server.constants';

describe('Frontend server command constants', () => {
  it('should expose expected command values', () => {
    expect(LIST_COMMAND).toBe('lst');
    expect(GRAPH_UPLOAD_COMMAND).toBe('adgr');
    expect(GRAPH_REMOVE_COMMAND).toBe('rmgr');
    expect(TRIANGLE_COUNT_COMMAND).toBe('trian');
    expect(GRAPH_DATA_COMMAND).toBe('graphv');
    expect(CYPHER_AST_COMMAND).toBe('cypher-ast');
    expect(CYPHER_COMMAND).toBe('cypher');
    expect(SEMANTIC_BEAM_SEARCH_COMMAND).toBe('sbs');
    expect(INDEGREE_COMMAND).toBe('idd');
    expect(OUTDEGREE_COMMAND).toBe('odd');
    expect(PROPERTIES_COMMAND).toBe('prp');
    expect(UPLOAD_FROM_HDFS).toBe('adhdfs');
    expect(CONSTRUCT_KG_COMMAND).toBe('constructkg');
    expect(STOP_CONSTRUCT_KG_COMMAND).toBe('stop-constructkg');
  });

  it('should have unique command values', () => {
    const commands = [
      LIST_COMMAND,
      GRAPH_UPLOAD_COMMAND,
      GRAPH_REMOVE_COMMAND,
      TRIANGLE_COUNT_COMMAND,
      GRAPH_DATA_COMMAND,
      CYPHER_AST_COMMAND,
      CYPHER_COMMAND,
      SEMANTIC_BEAM_SEARCH_COMMAND,
      INDEGREE_COMMAND,
      OUTDEGREE_COMMAND,
      PROPERTIES_COMMAND,
      UPLOAD_FROM_HDFS,
      CONSTRUCT_KG_COMMAND,
      STOP_CONSTRUCT_KG_COMMAND
    ];

    expect(new Set(commands).size).toBe(commands.length);
  });
});
