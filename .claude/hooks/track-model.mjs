#!/usr/bin/env node
// Fires on SessionStart and PostModelSwitch. Records which model is active
// per session_id so capture-prompt.mjs / capture-response.mjs can label
// log entries without needing a model field (Stop/UserPromptSubmit don't
// receive one — see https://code.claude.com/docs/en/hooks.md#common-input-fields).
import fs from "node:fs";
import path from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const stateDir = path.join(projectDir, ".claude", "hooks");
const stateFile = path.join(stateDir, ".model-state.json");

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

const input = readStdin();
const sessionId = input.session_id;
// SessionStart -> "model" (optional). PostModelSwitch -> "to_model".
const model = input.model || input.to_model;

if (sessionId && model) {
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
  let state = {};
  try {
    state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    // no state yet
  }
  state[sessionId] = model;
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
}

process.exit(0);
