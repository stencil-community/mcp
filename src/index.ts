#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createStencilMcpServer, SERVER_NAME, SERVER_VERSION } from './server.js';

async function main() {
  const server = createStencilMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr so we never corrupt the stdio JSON-RPC channel.
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

main().catch((err) => {
  console.error('Fatal error starting Stencil MCP server:', err);
  process.exit(1);
});
