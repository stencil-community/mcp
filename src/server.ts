import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { detectStencilVersion } from './detectVersion.js';
import { DECORATORS, LIFECYCLE } from './data/decorators.js';
import { BEST_PRACTICES } from './data/bestPractices.js';
import { BREAKING_CHANGES_URL, V5_CHANGES } from './data/v5Migration.js';
import { findV4Usage } from './v5Migration.js';
import { forVersion, isAvailableIn, splitByVersion } from './versionFilter.js';

export const SERVER_NAME = '@stencil-community/mcp';
export const SERVER_VERSION = '0.1.0';

/**
 * Builds the Stencil MCP server with its tool set registered.
 * Exported (rather than only run) so it can be unit-tested in-process.
 */
export function createStencilMcpServer(): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'detect_stencil_version',
        description:
          "Detect the StencilJS version a project is actually using so suggestions match the installed framework. Reads node_modules/@stencil/core and package.json.",
        inputSchema: {
          type: 'object',
          properties: {
            projectRoot: {
              type: 'string',
              description:
                "Absolute path to the project root. Required: an MCP server is spawned by the client (e.g. Claude Desktop) and does not run from the project directory, so the path must be passed explicitly.",
            },
          },
          required: ['projectRoot'],
        },
      },
      {
        name: 'get_decorator_reference',
        description:
          'Get accurate reference for StencilJS decorators (@Component, @Prop, @State, @Watch, @Event, @Listen, @Method, @Element, @AttachInternals, @PropSerialize, @AttrDeserialize), including signatures, idiomatic examples, and anti-patterns to avoid. Pass a version (or projectRoot) to get the API as it is in the Stencil the project actually runs; some decorators differ between Stencil 4 and 5.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Optional decorator name (without @) to look up. Omit to list all decorators.',
            },
            version: {
              type: 'string',
              description:
                'Optional Stencil version (e.g. "4.4.0"). Decorators introduced after this version are excluded when listing, or flagged as unavailable when looked up by name. Takes precedence over projectRoot.',
            },
            projectRoot: {
              type: 'string',
              description:
                "Optional absolute path to the project root. When given (and version is not), the installed @stencil/core version is detected and used to filter the reference automatically.",
            },
          },
        },
      },
      {
        name: 'get_lifecycle_reference',
        description:
          'Get the StencilJS component lifecycle methods (componentWillLoad, componentDidLoad, render, etc.) with when each fires. Pass a version (or projectRoot) to get the behavior in that version.',
        inputSchema: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              description: 'Optional Stencil version (e.g. "5.0.0"). Takes precedence over projectRoot.',
            },
            projectRoot: {
              type: 'string',
              description: 'Optional absolute path to the project root, used to detect the version.',
            },
          },
        },
      },
      {
        name: 'get_best_practices',
        description:
          'Get idiomatic StencilJS best practices as concrete "wrong vs right" rules, so AI suggestions use built-in Stencil features instead of manual workarounds. Pass a version (or projectRoot) to leave out rules that do not apply to it, or have one flagged when looked up by id.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Optional best-practice id to fetch a single rule. Omit to get all.',
            },
            version: {
              type: 'string',
              description: 'Optional Stencil version (e.g. "5.0.0"). Takes precedence over projectRoot.',
            },
            projectRoot: {
              type: 'string',
              description: 'Optional absolute path to the project root, used to detect the version.',
            },
          },
        },
      },
      {
        name: 'get_v5_migration_guide',
        description:
          'List what changed between Stencil 4 and 5, what to use instead, and whether `stencil migrate` rewrites it.',
        inputSchema: {
          type: 'object',
          properties: {
            area: {
              type: 'string',
              enum: ['component', 'config', 'testing', 'tooling'],
              description: 'Optional area to limit the list to.',
            },
          },
        },
      },
      {
        name: 'check_v5_compatibility',
        description:
          'Check code (a component, stencil.config.ts or package.json) for Stencil 4 APIs that changed in Stencil 5. Use it on code for a Stencil 5 project before suggesting it. Text-based: an empty result does not prove the code is compatible.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The source code to check.' },
          },
          required: ['code'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;

    switch (name) {
      case 'detect_stencil_version': {
        const root = args.projectRoot as string | undefined;
        if (!root) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: 'detect_stencil_version requires a "projectRoot" argument (an absolute path to the project). It cannot be inferred, because the MCP server is spawned by the client rather than run from the project directory.',
              },
            ],
          };
        }
        const info = await detectStencilVersion(root);
        return textResult(info.message + '\n\n' + JSON.stringify(info, null, 2));
      }

      case 'get_decorator_reference': {
        const wanted = (args.name as string | undefined)?.replace(/^@/, '').toLowerCase();
        const version = await resolveVersion(
          args.version as string | undefined,
          args.projectRoot as string | undefined,
        );

        if (wanted) {
          const doc = DECORATORS.find((d) => d.name.toLowerCase() === wanted);
          if (!doc) {
            return textResult(
              `Unknown decorator "@${wanted}". Known decorators: ${DECORATORS.map((d) => '@' + d.name).join(', ')}.`,
            );
          }
          if (version && !isAvailableIn(version, doc.since)) {
            return textResult(
              JSON.stringify(
                {
                  decorator: doc,
                  availableInVersion: false,
                  note: `@${doc.name} was introduced in Stencil ${doc.since} but this project runs ${version}. Do not suggest it here.`,
                },
                null,
                2,
              ),
            );
          }
          return textResult(JSON.stringify(forVersion(doc, version), null, 2));
        }

        if (!version) {
          return textResult(JSON.stringify(DECORATORS, null, 2));
        }
        const { available, unavailable } = splitByVersion(DECORATORS, version);
        return textResult(
          JSON.stringify(
            {
              stencilVersion: version,
              decorators: available.map((d) => forVersion(d, version)),
              unavailable,
            },
            null,
            2,
          ),
        );
      }

      case 'get_lifecycle_reference': {
        const version = await resolveVersion(
          args.version as string | undefined,
          args.projectRoot as string | undefined,
        );
        return textResult(
          JSON.stringify(LIFECYCLE.map((l) => forVersion(l, version)), null, 2),
        );
      }

      case 'get_best_practices': {
        const id = args.id as string | undefined;
        const version = await resolveVersion(
          args.version as string | undefined,
          args.projectRoot as string | undefined,
        );
        if (id) {
          const bp = BEST_PRACTICES.find((b) => b.id === id);
          if (!bp) return textResult(`Unknown best-practice id "${id}".`);
          if (!isAvailableIn(version, bp.since)) {
            return textResult(
              JSON.stringify(
                {
                  bestPractice: bp,
                  availableInVersion: false,
                  note: `This rule applies from Stencil ${bp.since} but this project runs ${version}. Do not apply it here.`,
                },
                null,
                2,
              ),
            );
          }
          return textResult(JSON.stringify(forVersion(bp, version), null, 2));
        }
        const rules = BEST_PRACTICES.filter((b) => isAvailableIn(version, b.since));
        return textResult(
          JSON.stringify(rules.map((b) => forVersion(b, version)), null, 2),
        );
      }

      case 'get_v5_migration_guide': {
        const area = args.area as string | undefined;
        const changes = area ? V5_CHANGES.filter((c) => c.area === area) : V5_CHANGES;
        if (changes.length === 0) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Unknown area "${area}".` }],
          };
        }
        return textResult(
          JSON.stringify(
            { preview: 'stencil migrate --dry-run (requires Stencil 5)', changes, fullList: BREAKING_CHANGES_URL },
            null,
            2,
          ),
        );
      }

      case 'check_v5_compatibility': {
        if (typeof args.code !== 'string') {
          return {
            isError: true,
            content: [{ type: 'text', text: 'check_v5_compatibility requires a "code" string.' }],
          };
        }
        const findings = findV4Usage(args.code);
        return textResult(
          JSON.stringify(
            {
              findings,
              note: 'Text-based check of this code only. Run `stencil migrate --dry-run` (requires Stencil 5) to check the project.',
              fullList: BREAKING_CHANGES_URL,
            },
            null,
            2,
          ),
        );
      }

      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        };
    }
  });

  return server;
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

/**
 * Resolves the Stencil version to filter reference output against.
 *
 * An explicit `version` wins. Otherwise, if a `projectRoot` is given, the
 * installed (or, failing that, declared) version is detected from disk. Returns
 * undefined when neither yields a version, in which case callers do not filter.
 */
async function resolveVersion(
  version: string | undefined,
  projectRoot: string | undefined,
): Promise<string | undefined> {
  if (version) return version;
  if (!projectRoot) return undefined;
  const info = await detectStencilVersion(projectRoot);
  return info.installedVersion ?? info.declaredRange ?? undefined;
}
