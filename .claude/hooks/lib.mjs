// Shared helpers for capture-prompt.mjs and capture-response.mjs.
import fs from "node:fs";
import path from "node:path";

export const AUTHOR = "mumarkhan999";
export const TOOL = "claude-code";
export const PROJECT = "8x-ebazar";
// Fallback if SessionStart/PostModelSwitch haven't recorded a model yet for
// this session_id (SessionStart's "model" field is documented as optional).
export const DEFAULT_MODEL = "claude-sonnet-5";

export const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
export const logsDir = path.join(projectDir, ".agent-logs");
export const stateFile = path.join(projectDir, ".claude", "hooks", ".model-state.json");

export function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

export function getModel(sessionId) {
  try {
    const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    return state[sessionId] || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function findLogFile(sessionId) {
  if (!fs.existsSync(logsDir)) return null;
  const files = fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith(`_${sessionId}.md`));
  return files.length ? path.join(logsDir, files[0]) : null;
}

export function countEntries(content, type) {
  const re = new RegExp(`\\[LOG_ENTRY type=${type}`, "g");
  return (content.match(re) || []).length;
}

export function isoNow() {
  return new Date().toISOString();
}

export function updateFrontmatter(content, updates) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return content;
  let fm = fmMatch[1];
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}:.*$`, "m");
    if (re.test(fm)) {
      fm = fm.replace(re, `${key}: ${value}`);
    } else {
      fm += `\n${key}: ${value}`;
    }
  }
  return content.replace(fmMatch[0], `---\n${fm}\n---\n`);
}
