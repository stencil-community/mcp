# @stencil-community/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI
coding agents **accurate knowledge of a StencilJS project, including the version
it is actually running**.

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
| `get_decorator_reference` | Signatures, idiomatic examples, and anti-patterns for `@Component`, `@Prop`, `@State`, `@Watch`, `@Event`, `@Listen`, `@Method`, `@Element`, `@AttachInternals`, `@PropSerialize`, `@AttrDeserialize`. Accepts an optional `version` or `projectRoot`. |
| `get_lifecycle_reference` | The component lifecycle hooks and when each fires. Accepts an optional `version` or `projectRoot`. |
| `get_best_practices` | Concrete "wrong vs right" rules so agents use built-in Stencil features. Accepts an optional `version` or `projectRoot`. |
| `get_v5_migration_guide` | What changed between Stencil 4 and 5, and whether `stencil migrate` rewrites it. |
| `check_v5_compatibility` | Finds Stencil 4 APIs that changed in Stencil 5 in a piece of code. |

Reference content is sourced from Stencil's own public runtime type declarations
and its list of breaking changes, so it matches the framework rather than guessing.

> **On versioning:** `detect_stencil_version` resolves the project's actual
> version at call time. The decorator, lifecycle and best-practice tools are
> version-aware: pass a `version` (e.g. `"4.4.0"`), or a `projectRoot` to have the
> installed version detected automatically. Decorators and rules introduced later
> are dropped from the listing (decorators are reported under `unavailable`) or
> flagged `availableInVersion: false` when looked up by name or id. APIs added
> after Stencil 1.x carry a `since`
> marker (e.g. `@AttachInternals` is `since: 4.5.0`) that drives this filtering.
> Where an API differs between versions, the reference tools return it as it is
> in the given version, e.g. `encapsulation` instead of `shadow` in Stencil 5.
> Called without a version, they return the Stencil 4 reference with later
> differences listed under `changes`, and rules for later versions marked `since`.

> **Stencil 5** content is based on the 5.0 release candidate. The compatibility
> check is a text scan for single pieces of code; use `stencil migrate` (Stencil 5)
> to check and rewrite a whole project.

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
