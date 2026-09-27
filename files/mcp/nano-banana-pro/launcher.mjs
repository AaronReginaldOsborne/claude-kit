// Windows launcher for the nano-banana-pro MCP server (@rafarafarafa/nano-banana-pro-mcp).
//
// Why this exists: the package only starts its server when its entry file is run
// under a Unix-style path (it compares `file://${process.argv[1]}` with
// import.meta.url and checks the path ends in "nano-banana-pro-mcp"). On Windows
// neither check passes, so `npx @rafarafarafa/nano-banana-pro-mcp` exits at once
// and Claude Code reports "Connection closed". This file starts the same server
// through the package's exported createServer().
//
// macOS and Linux do not need it: there the plain npx command works.
// SETUP.md copies this folder to ~/.claude/mcp/nano-banana-pro/, runs
// npm ci --prefix <that folder>, and registers: claude mcp add --scope user nano-banana-pro
//   --env GEMINI_API_KEY=<key> -- node <that folder>/launcher.mjs
import { createServer } from "@rafarafarafa/nano-banana-pro-mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

const server = createServer(apiKey);
await server.connect(new StdioServerTransport());
console.error("Nano Banana Pro MCP server started (Windows launcher)");
