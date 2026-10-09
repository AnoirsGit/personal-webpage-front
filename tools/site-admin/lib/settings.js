/*
 * The admin's settings, all from the environment (the box: site-admin.service plus
 * /etc/site-admin/env, which holds the token and the allowed host names):
 *
 *   SITE_ADMIN_TOKEN           required, 16+ characters, no whitespace
 *   SITE_CONFIG_PATH           required: the file the admin writes, outside any git work tree
 *                              (so also outside the repo's build/)
 *   SITE_REBUILD_STATUS_DIR    where the rebuild service writes status.json and rebuild.log
 *                              (the box: /var/lib/site-rebuild); unset → save only
 *   SITE_REBUILD_REQUEST_PATH  the file "rebuild again" rewrites; the rebuild's path unit
 *                              watches it; default: rebuild-request next to SITE_CONFIG_PATH
 *   SITE_ADMIN_BIND            default 127.0.0.1
 *   SITE_ADMIN_PORT            default 8792
 *   SITE_ADMIN_ALLOWED_HOSTS   comma-separated names (host or host:port) the Host header may
 *                              carry; default 127.0.0.1:<port>,localhost:<port>
 *   SITE_ADMIN_COUNTRIES       countries geojson; default: the repo's, next to this tool
 *   SITE_ADMIN_DEFAULT_CONFIG  shown until the first save; default: the repo's site-config.json
 */
import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, join } from 'node:path';

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

	const statusDir = env.SITE_REBUILD_STATUS_DIR || null;
	if (statusDir && !isAbsolute(statusDir)) {
		problems.push('SITE_REBUILD_STATUS_DIR must be an absolute path');
	}
	const requestPath =
		env.SITE_REBUILD_REQUEST_PATH ||
		(configPath ? join(dirname(configPath), 'rebuild-request') : '');
	if (requestPath && !isAbsolute(requestPath)) {
		problems.push('SITE_REBUILD_REQUEST_PATH must be an absolute path');
	}

	if (problems.length) throw new SettingsError(problems);

	return {
		token,
		bind: env.SITE_ADMIN_BIND || '127.0.0.1',
		port,
		allowedHosts: parseAllowedHosts(env.SITE_ADMIN_ALLOWED_HOSTS, port),
		configPath,
		rebuildStatusDir: statusDir,
		rebuildRequestPath: requestPath,
		countriesPath:
			env.SITE_ADMIN_COUNTRIES || repoFile('src/lib/ne_110m_admin_0_countries.geojson'),
		defaultConfigPath: env.SITE_ADMIN_DEFAULT_CONFIG || repoFile('src/lib/config/site-config.json')
	};
};
