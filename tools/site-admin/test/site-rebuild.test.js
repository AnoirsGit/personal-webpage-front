/*
 * ops/box/site-rebuild.sh, the script site-rebuild.service runs as root when the path unit
 * sees a save. Here a fake deploy stands in for deploy.sh and the test plays the path unit:
 * it starts the script and writes the admin's files the way the admin does.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { writeFileAtomic } from '../lib/config.js';
import { FAKE_REBUILD, GEORGIA, SITE_REBUILD, tempDir } from './helpers.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setup = (t, extra = {}) => {
	const dir = tempDir(t);
	const statusDir = join(dir, 'rebuild');
	const env = {
		...process.env,
		SITE_REBUILD_STATUS_DIR: statusDir,
		SITE_CONFIG_PATH: join(dir, 'state', 'site-config.json'),
		SITE_REBUILD_REQUEST_PATH: join(dir, 'state', 'rebuild-request'),
		SITE_REBUILD_DEPLOY: `"${process.execPath}" "${FAKE_REBUILD}"`,
		FAKE_REBUILD_MS: '400',
		FAKE_REBUILD_JOURNAL: join(dir, 'journal'),
		...extra
	};
	mkdirSync(join(dir, 'state'), { recursive: true });
	const run = (args = []) =>
		new Promise((resolve) => {
			const child = spawn('bash', [SITE_REBUILD, ...args], { env });
			let output = '';
			child.stdout.on('data', (chunk) => (output += chunk));
			child.stderr.on('data', (chunk) => (output += chunk));
			child.on('close', (code) => resolve({ code, output }));
		});
	const status = () => JSON.parse(readFileSync(join(statusDir, 'status.json'), 'utf8'));
	const log = () => readFileSync(join(statusDir, 'rebuild.log'), 'utf8');
	const deploys = () =>
		readFileSync(env.FAKE_REBUILD_JOURNAL, 'utf8')
			.trim()
			.split('\n')
			.map((line) => line.split(' ')[0]);
	const waitFor = async (check) => {
		for (let i = 0; i < 200; i++) {
			try {
				if (check()) return;
			} catch {
				// not written yet
			}
			await sleep(25);
		}
		throw new Error('timed out');
	};
	return { env, statusDir, run, status, log, deploys, waitFor };
};

test('a run: running, then ok, with the deploy output in a 0644 log', async (t) => {
	const s = setup(t);
	const done = s.run();
	await s.waitFor(() => s.status().status === 'running');
	const running = s.status();
	assert.equal(running.pass, 1);
	assert.match(running.startedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
	assert.equal(running.finishedAt, null);

	const { code } = await done;
	assert.equal(code, 0);
	const final = s.status();
	assert.deepEqual([final.status, final.pass, final.exitCode], ['ok', 1, 0]);
	assert.ok(Date.parse(final.finishedAt) >= Date.parse(final.startedAt));
	assert.match(s.log(), /pass 1: /);
	assert.match(s.log(), /deployed \S+ OK/);
	for (const name of ['status.json', 'rebuild.log']) {
		assert.equal(statSync(join(s.statusDir, name)).mode & 0o777, 0o644, name);
	}
	assert.deepEqual(readdirSync(s.statusDir).sort(), ['.lock', 'rebuild.log', 'status.json']);
});

test('a save during the build gets one more pass (systemd would drop that trigger)', async (t) => {
	const s = setup(t);
	writeFileSync(s.env.SITE_CONFIG_PATH, JSON.stringify({ home: GEORGIA }));
	const done = s.run();
	await s.waitFor(() => s.status().status === 'running');
	await writeFileAtomic(
		s.env.SITE_CONFIG_PATH,
		JSON.stringify({ home: { ...GEORGIA, lat: 41.7 } })
	);
	assert.equal((await done).code, 0);
	assert.deepEqual([s.status().status, s.status().pass], ['ok', 2]);
	assert.match(s.log(), /changed during the build: building again/);
	assert.deepEqual(s.deploys(), ['start', 'end', 'start', 'end'], 'passes never overlap');
});

test('"rebuild again" during the build counts as a change too', async (t) => {
	const s = setup(t);
	const done = s.run();
	await s.waitFor(() => s.status().status === 'running');
	await writeFileAtomic(s.env.SITE_REBUILD_REQUEST_PATH, `${new Date().toISOString()}\n`);
	assert.equal((await done).code, 0);
	assert.equal(s.status().pass, 2);
});

test('a failing deploy ends as fail with its exit code', async (t) => {
	const s = setup(t, { FAKE_REBUILD_EXIT: '3', FAKE_REBUILD_MS: '100' });
	const { code } = await s.run();
	assert.equal(code, 3);
	assert.deepEqual([s.status().status, s.status().exitCode], ['fail', 3]);
	assert.match(s.log(), /failed with exit code 3; the previous release stays live/);
});

test('one run at a time: a second start during a run leaves at once', async (t) => {
	const s = setup(t, { FAKE_REBUILD_MS: '800' });
	const first = s.run();
	await s.waitFor(() => s.status().status === 'running');
	const second = await s.run();
	assert.equal(second.code, 0);
	assert.match(second.output, /already running/);
	assert.equal((await first).code, 0);
	assert.deepEqual(s.deploys(), ['start', 'end']);
});

test('--mark-stopped turns a killed run into fail and leaves a finished one alone', async (t) => {
	const s = setup(t, { SERVICE_RESULT: 'signal' });
	mkdirSync(s.statusDir, { recursive: true });
	const startedAt = '2026-10-09T04:30:00.000Z';
	writeFileSync(
		join(s.statusDir, 'status.json'),
		JSON.stringify({ status: 'running', pass: 2, startedAt, finishedAt: null, exitCode: null })
	);
	assert.equal((await s.run(['--mark-stopped'])).code, 0);
	const stopped = s.status();
	assert.deepEqual(
		[stopped.status, stopped.pass, stopped.startedAt, stopped.exitCode],
		['fail', 2, startedAt, null]
	);
	assert.ok(stopped.finishedAt);
	assert.match(s.log(), /stopped before the end \(signal\)/);

	const finished = JSON.stringify({
		status: 'ok',
		pass: 1,
		startedAt,
		finishedAt: startedAt,
		exitCode: 0
	});
	writeFileSync(join(s.statusDir, 'status.json'), finished);
	await s.run(['--mark-stopped']);
	assert.equal(readFileSync(join(s.statusDir, 'status.json'), 'utf8'), finished);
});
