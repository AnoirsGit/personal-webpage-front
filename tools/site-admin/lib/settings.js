/*
 * The admin's settings, all from the environment (the box: site-admin.service plus
 * /etc/site-admin/env, which holds the token):
 *
 *   SITE_ADMIN_TOKEN           required, 16+ characters, no whitespace
 *   SITE_CONFIG_PATH           required: the file the admin writes, outside any git work tree
 *                              (so also outside the repo's build/)
 *   SITE_REBUILD_CMD           shell command run after a save (single flight); unset → save only
 *   SITE_REBUILD_TIMEOUT_SEC   default 1800
 *   SITE_ADMIN_BIND            default 127.0.0.1
 *   SITE_ADMIN_PORT            default 8792
 *   SITE_ADMIN_ALLOWED_HOSTS   comma-separated host:port values the Host header may carry;
 *                              default 127.0.0.1:<port>,localhost:<port>
 *   SITE_ADMIN_COUNTRIES       countries geojson; default: the repo's, next to this tool
 *   SITE_ADMIN_DEFAULT_CONFIG  shown until the first save; default: the repo's site-config.json
 */
import { fileURLToPath } from 'node:url';
import { isAbsolute } from 'node:path';

import { TOKEN_MIN_LENGTH, parseAllowedHosts } from './auth.js';
import { isInsideGitWorkTree } from './config.js';

const repoFile = (path) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));

export const DEFAULT_PORT = 8792;

export class SettingsError extends Error {
	constructor(problems) {
		super(`site-admin: bad settings:\n  - ${problems.join('\n  - ')}`);
		this.problems = problems;
	}
}

export const loadSettings = (env = process.env) => {
	const problems = [];

	const token = env.SITE_ADMIN_TOKEN || '';
	if (token.length < TOKEN_MIN_LENGTH) {
		problems.push(`SITE_ADMIN_TOKEN must be at least ${TOKEN_MIN_LENGTH} characters`);
	} else if (/\s/.test(token)) {
		problems.push('SITE_ADMIN_TOKEN must not contain whitespace');
	}

	const port = env.SITE_ADMIN_PORT === undefined ? DEFAULT_PORT : Number(env.SITE_ADMIN_PORT);
	if (!Number.isInteger(port) || port < 0 || port > 65535) {
		problems.push('SITE_ADMIN_PORT must be a port number');
	}

	const configPath = env.SITE_CONFIG_PATH || '';
	if (!configPath) problems.push('SITE_CONFIG_PATH is required');
	else if (!isAbsolute(configPath)) problems.push('SITE_CONFIG_PATH must be an absolute path');
	else if (isInsideGitWorkTree(configPath)) {
		problems.push('SITE_CONFIG_PATH must be outside any git work tree (and the build output)');
	}

	const timeoutSec =
		env.SITE_REBUILD_TIMEOUT_SEC === undefined ? 1800 : Number(env.SITE_REBUILD_TIMEOUT_SEC);
	if (!(timeoutSec > 0)) problems.push('SITE_REBUILD_TIMEOUT_SEC must be a positive number');

	if (problems.length) throw new SettingsError(problems);

	return {
		token,
		bind: env.SITE_ADMIN_BIND || '127.0.0.1',
		port,
		allowedHosts: parseAllowedHosts(env.SITE_ADMIN_ALLOWED_HOSTS, port),
		configPath,
		rebuildCommand: (env.SITE_REBUILD_CMD || '').trim() || null,
		rebuildTimeoutMs: timeoutSec * 1000,
		countriesPath: env.SITE_ADMIN_COUNTRIES || repoFile('src/lib/ne_110m_admin_0_countries.geojson'),
		defaultConfigPath: env.SITE_ADMIN_DEFAULT_CONFIG || repoFile('src/lib/config/site-config.json')
	};
};
