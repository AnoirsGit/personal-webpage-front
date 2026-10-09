#!/usr/bin/env node
/*
 * Stand-in for ops/box/site-rebuild.path on a laptop: watches the admin's saved config and
 * its rebuild-request file and runs the real ops/box/site-rebuild.sh with a fake deploy
 * (./fake-rebuild.js), as site-rebuild.service would on the box.
 *
 *   node tools/site-admin/test/fixtures/fake-path-unit.js <SITE_CONFIG_PATH> <SITE_REBUILD_STATUS_DIR>
 *
 * Like systemd it starts one run at a time and drops a trigger that arrives during a run;
 * the script's own repeat picks such a save up, exactly as on the box.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, watch } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [configPath, statusDir] = process.argv.slice(2);
if (!configPath || !statusDir) {
	console.error('usage: fake-path-unit.js <SITE_CONFIG_PATH> <SITE_REBUILD_STATUS_DIR>');
	process.exit(2);
}
const directory = dirname(configPath);
const requestPath = join(directory, 'rebuild-request');
const script = fileURLToPath(new URL('../../../../ops/box/site-rebuild.sh', import.meta.url));
const fakeDeploy = fileURLToPath(new URL('./fake-rebuild.js', import.meta.url));
const watched = new Set([basename(configPath), basename(requestPath)]);

mkdirSync(directory, { recursive: true });
let running = false;
let timer = null;

const run = () => {
	if (running) return;
	running = true;
	const child = spawn('bash', [script], {
		stdio: 'inherit',
		env: {
			...process.env,
			SITE_CONFIG_PATH: configPath,
			SITE_REBUILD_REQUEST_PATH: requestPath,
			SITE_REBUILD_STATUS_DIR: statusDir,
			SITE_REBUILD_DEPLOY: `"${process.execPath}" "${fakeDeploy}"`
		}
	});
	child.on('close', () => {
		running = false;
	});
};

watch(directory, (event, name) => {
	if (!watched.has(String(name))) return;
	clearTimeout(timer);
	timer = setTimeout(run, 50);
});
console.log(`fake path unit: ${configPath}, ${requestPath} → ${statusDir}`);
