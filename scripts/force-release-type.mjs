// semantic-release plugin used when a release type is chosen manually in the
// Release workflow. It replaces @semantic-release/commit-analyzer and returns
// the requested bump instead of deriving one from conventional commits.
const ALLOWED = ['patch', 'minor', 'major'];

export function analyzeCommits(_pluginConfig, { logger }) {
  const type = process.env.RELEASE_TYPE;
  if (!ALLOWED.includes(type)) {
    throw new Error(`RELEASE_TYPE must be one of ${ALLOWED.join(', ')} (got "${type}")`);
  }
  logger.log(`Forcing a ${type} release (manual override)`);
  return type;
}
