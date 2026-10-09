#!/usr/bin/env node
/*
 * Place admin for the site: pick the country you are in (plus city, coordinates and time
 * zone) and save it to SITE_CONFIG_PATH. It runs nothing else: on the box a root path unit
 * (ops/box/site-rebuild.path) rebuilds the site when that file changes, and the admin shows
 * the progress it writes to SITE_REBUILD_STATUS_DIR. No dependencies; settings come from
 * the environment (see lib/settings.js).
 *
 *   SITE_ADMIN_TOKEN=… SITE_CONFIG_PATH=/var/lib/site-admin/site-config.json \
 *   SITE_REBUILD_STATUS_DIR=/var/lib/site-rebuild node tools/site-admin/server.js
 *
 * Then open http://127.0.0.1:8792/?token=… once. On the box it runs as site-admin.service
 * (ops/box/install.sh). Locally, test/fixtures/fake-path-unit.js stands in for the path unit.
 */
import { createAdmin } from './lib/app.js';
import { SettingsError, loadSettings } from './lib/settings.js';

const log = (line) => console.log(`[${new Date().toISOString()}] ${line}`);

let settings;
try {
	settings = loadSettings(process.env);
} catch (error) {
	console.error(error instanceof SettingsError ? error.message : error);
	process.exit(2);
}

const { server, countries } = createAdmin(settings, { log });

server.listen(settings.port, settings.bind, () => {
	const { port } = server.address();
	log(`site-admin on http://${settings.bind}:${port}/ — ${countries.length} countries`);
	log(`allowed hosts: ${[...settings.allowedHosts].join(', ')}`);
	log(`config: ${settings.configPath}`);
	log(
		settings.rebuildStatusDir
			? `rebuild status: ${settings.rebuildStatusDir} (request file ${settings.rebuildRequestPath})`
			: 'rebuild: not configured (save only)'
	);
	if (!['127.0.0.1', '::1', 'localhost'].includes(settings.bind)) {
		log(`warning: listening on ${settings.bind}, not only on loopback`);
	}
});

const stop = (signal) => {
	log(`${signal}: stopping`);
	server.close(() => process.exit(0));
	setTimeout(() => process.exit(0), 2000).unref();
};
process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));
