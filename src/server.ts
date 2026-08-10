import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { detectStencilVersion } from './detectVersion.js';
import { DECORATORS, LIFECYCLE } from './data/decorators.js';
import { BEST_PRACTICES } from './data/bestPractices.js';
import { isAvailableIn, splitByVersion } from './versionFilter.js';

export const SERVER_NAME = '@stencil/mcp';
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
          'Get accurate reference for StencilJS decorators (@Component, @Prop, @State, @Watch, @Event, @Listen, @Method, @Element, @AttachInternals), including signatures, idiomatic examples, and anti-patterns to avoid. Pass a version (or projectRoot) to filter out decorators introduced after the Stencil the project actually runs.',
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
          'Get the StencilJS component lifecycle methods (componentWillLoad, componentDidLoad, render, etc.) with when each fires.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_best_practices',
        description:
          'Get idiomatic StencilJS best practices as concrete "wrong vs right" rules, so AI suggestions use built-in Stencil features instead of manual workarounds.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Optional best-practice id to fetch a single rule. Omit to get all.',
            },
          },
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
          return textResult(JSON.stringify(doc, null, 2));
        }

        if (!version) {
          return textResult(JSON.stringify(DECORATORS, null, 2));
        }
        const { available, unavailable } = splitByVersion(DECORATORS, version);
        return textResult(
          JSON.stringify({ stencilVersion: version, decorators: available, unavailable }, null, 2),
        );
      }

      case 'get_lifecycle_reference':
        return textResult(JSON.stringify(LIFECYCLE, null, 2));

      case 'get_best_practices': {
        const id = args.id as string | undefined;
        if (id) {
          const bp = BEST_PRACTICES.find((b) => b.id === id);
          return textResult(
            bp ? JSON.stringify(bp, null, 2) : `Unknown best-practice id "${id}".`,
          );
        }
        return textResult(JSON.stringify(BEST_PRACTICES, null, 2));
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
