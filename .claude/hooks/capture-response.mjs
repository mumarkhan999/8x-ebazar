#!/usr/bin/env node
// Stop hook. Input schema (verified against
// https://code.claude.com/docs/en/hooks.md#stop-input):
//   common fields + stop_hook_active, last_assistant_message,
//   background_tasks, session_crons
import fs from "node:fs";
import {
  readStdin,
  getModel,
  findLogFile,
  countEntries,
  isoNow,
  updateFrontmatter,
} from "./lib.mjs";

const input = readStdin();
const sessionId = input.session_id;
const response = input.last_assistant_message ?? "";
if (!sessionId) process.exit(0);

const filePath = findLogFile(sessionId);
if (!filePath) process.exit(0); // no PROMPT entry yet for this session

let content = fs.readFileSync(filePath, "utf8");
const num = countEntries(content, "PROMPT");
if (num === 0) process.exit(0);

const timestamp = isoNow();
const model = getModel(sessionId);

content = updateFrontmatter(content, { last_prompt_time: timestamp });

content += `
[LOG_ENTRY type=RESPONSE num=${num} session=${sessionId}]
timestamp: ${timestamp}
model: ${model}

${response}

`;

fs.writeFileSync(filePath, content, "utf8");
process.exit(0);
