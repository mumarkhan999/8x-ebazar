#!/usr/bin/env node
// UserPromptSubmit hook. Input schema (verified against
// https://code.claude.com/docs/en/hooks.md#userpromptsubmit-input):
//   { session_id, transcript_path, cwd, permission_mode, hook_event_name, prompt }
import fs from "node:fs";
import path from "node:path";
import {
  AUTHOR,
  TOOL,
  PROJECT,
  logsDir,
  readStdin,
  getModel,
  findLogFile,
  countEntries,
  isoNow,
  updateFrontmatter,
} from "./lib.mjs";

const input = readStdin();
const sessionId = input.session_id;
const prompt = input.prompt ?? "";
if (!sessionId) process.exit(0);

const timestamp = isoNow();
const model = getModel(sessionId);

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

let filePath = findLogFile(sessionId);
let content;

if (!filePath) {
  const dateStr = timestamp.slice(0, 10);
  const timeStr = timestamp.slice(11, 19).replace(/:/g, "-");
  const fileName = `${dateStr}_${timeStr}_${sessionId}.md`;
  filePath = path.join(logsDir, fileName);
  content = `---
session_id: ${sessionId}
date: ${dateStr}
author: ${AUTHOR}
model: ${model}
tool: ${TOOL}
project: ${PROJECT}
total_exchanges: 0
first_prompt_time: ${timestamp}
last_prompt_time: ${timestamp}
---

# Session Log - ${dateStr}

Session: \`${sessionId}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\`

---
`;
} else {
  content = fs.readFileSync(filePath, "utf8");
}

const num = countEntries(content, "PROMPT") + 1;

content = updateFrontmatter(content, {
  total_exchanges: num,
  last_prompt_time: timestamp,
  model,
});

content += `
[LOG_ENTRY type=PROMPT num=${num} session=${sessionId}]
timestamp: ${timestamp}
model: ${model}

${prompt}

`;

fs.writeFileSync(filePath, content, "utf8");
process.exit(0);
