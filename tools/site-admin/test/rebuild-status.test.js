import assert from 'node:assert/strict';
import { mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { readRebuildState, readTail } from '../lib/rebuild-status.js';
import { tempDir } from './helpers.js';

const at = (ms) => new Date(ms).toISOString();
// whole seconds, so a file's mtime round-trips exactly
const secondsAgo = (seconds) => Math.floor(Date.now() / 1000) * 1000 - seconds * 1000;

const setup = (t) => {
	const dir = tempDir(t);
	const statusDir = join(dir, 'rebuild');
	const config = join(dir, 'site-config.json');
	const request = join(dir, 'rebuild-request');
	const writeStatus = (fields) => {
		mkdirSync(statusDir, { recursive: true });
		writeFileSync(
			join(statusDir, 'status.json'),
			JSON.stringify({ pass: 1, finishedAt: null, exitCode: null, ...fields })
		);
	};
	const touch = (path, ms) => {
		writeFileSync(path, 'x');
		utimesSync(path, ms / 1000, ms / 1000);
	};
	const read = () => readRebuildState({ statusDir, triggers: [config, request] });
	return { statusDir, config, request, writeStatus, touch, read };
};

test('no status directory configured: save only', async () => {
	const state = await readRebuildState({ statusDir: null, triggers: [] });
	assert.equal(state.configured, false);
	assert.equal(state.status, 'idle');
});

test('nothing built yet: idle; a save no run has picked up yet: waiting', async (t) => {
	const s = setup(t);
	let state = await s.read();
	assert.deepEqual(
		[state.configured, state.status, state.pendingSince, state.log],
		[true, 'idle', null, '']
	);
	const saved = secondsAgo(1);
	s.touch(s.config, saved);
	state = await s.read();
	assert.equal(state.status, 'idle');
	assert.equal(state.pendingSince, at(saved));
});

test('the files site-rebuild.sh writes: running, a save during it, then ok or fail', async (t) => {
	const s = setup(t);
	const t0 = secondsAgo(60);
	s.touch(s.config, t0);
	s.writeStatus({ status: 'running', pass: 1, startedAt: at(t0 + 1000) });
	mkdirSync(s.statusDir, { recursive: true });
	writeFileSync(join(s.statusDir, 'rebuild.log'), '\u001b[32mvite\u001b[39m building\r\nok\n');

	let state = await s.read();
	assert.deepEqual(
		[state.status, state.pass, state.queued, state.pendingSince],
		['running', 1, false, null],
		'the running pass includes the save'
	);
	assert.equal(state.log, 'vite building\nok\n', 'colours and carriage returns gone');

	s.touch(s.request, t0 + 5000); // "rebuild again" (or another save) during the pass
	state = await s.read();
	assert.equal(state.queued, true, 'one more pass will follow');

	s.writeStatus({
		status: 'ok',
		pass: 2,
		startedAt: at(t0 + 6000),
		finishedAt: at(t0 + 9000),
		exitCode: 0
	});
	state = await s.read();
	assert.deepEqual(
		[state.status, state.pass, state.exitCode, state.queued, state.pendingSince],
		['ok', 2, 0, false, null]
	);
	assert.equal(state.finishedAt, at(t0 + 9000));

	s.writeStatus({
		status: 'fail',
		startedAt: at(t0 + 10000),
		finishedAt: at(t0 + 11000),
		exitCode: 2
	});
	state = await s.read();
	assert.deepEqual([state.status, state.exitCode], ['fail', 2]);

	s.touch(s.config, t0 + 20000); // a save after the last run, not picked up yet
	state = await s.read();
	assert.equal(state.status, 'fail');
	assert.equal(state.pendingSince, at(t0 + 20000));
});

test('a broken or unknown status file reads as idle', async (t) => {
	const s = setup(t);
	mkdirSync(s.statusDir, { recursive: true });
	writeFileSync(join(s.statusDir, 'status.json'), '{ half a json');
	assert.equal((await s.read()).status, 'idle');
	s.writeStatus({ status: 'exploded', startedAt: 'yesterday' });
	const state = await s.read();
	assert.deepEqual([state.status, state.startedAt], ['idle', null]);
});

test('the log tail is bounded and starts on a whole line', async (t) => {
	const s = setup(t);
	const path = join(s.statusDir, 'rebuild.log');
	mkdirSync(s.statusDir, { recursive: true });
	writeFileSync(path, Array.from({ length: 5000 }, (_, i) => `line ${i}`).join('\n') + '\n');
	const tail = await readTail(path, 2000);
	assert.ok(tail.length <= 2002, `tail is ${tail.length} chars`);
	assert.ok(tail.startsWith('…\nline '));
	assert.ok(tail.endsWith('line 4999\n'));
	assert.equal(await readTail(join(s.statusDir, 'missing.log'), 100), '');
});
