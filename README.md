# @stencil-community/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI
coding agents **accurate, version-aware knowledge of a StencilJS project**.

> Community project, originally proposed in [stenciljs/core#6518](https://github.com/stenciljs/core/issues/6518).

## Why

AI agents frequently suggest non-idiomatic Stencil code — e.g. manually adding a
`window.addEventListener` in `componentWillLoad` instead of using the built-in
`@Listen()` decorator, or mutating a `@Prop`. This server exposes Stencil's real
API surface and best practices to the agent so it can self-correct, and tells it
which Stencil version the project is actually running.

## Tools

| Tool | Purpose |
| --- | --- |
| `detect_stencil_version` | Resolves the version from `node_modules/@stencil/core` (authoritative) and the declared range in `package.json`. |
| `get_decorator_reference` | Signatures, idiomatic examples, and anti-patterns for `@Component`, `@Prop`, `@State`, `@Watch`, `@Event`, `@Listen`, `@Method`, `@Element`, `@AttachInternals`. |
| `get_lifecycle_reference` | The component lifecycle hooks and when each fires. |
| `get_best_practices` | Concrete "wrong vs right" rules so agents use built-in Stencil features. |

All reference content is sourced from Stencil's own public runtime type
declarations, so it matches the framework rather than guessing.

## Usage

```bash
npm install && npm run build
```

Register with an MCP-capable client (Claude Desktop, Cursor, VS Code, etc.):

```json
{
  "mcpServers": {
    "stencil": {
      "command": "npx",
      "args": ["-y", "@stencil-community/mcp"]
    }
  }
}
```

## Develop

```bash
npm run build      # compile TypeScript
npm test           # unit tests (node:test)
node test/smoke.mjs # end-to-end MCP stdio test
```

## License

MIT
