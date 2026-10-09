import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { childEnv } from '../lib/app.js';
import { createRebuilder } from '../lib/rebuild.js';
import { FAKE_REBUILD, tempDir } from './helpers.js';

const journalEvents = (path) =>
	readFileSync(path, 'utf8')
		.trim()
		.split('\n')
		.map((line) => {
			const [event, at] = line.split(' ');
			return { event, at: Number(at) };
		});

const isAlive = (pid) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
};

test('single flight: triggers during a run collapse into one follow-up, never overlapping', async (t) => {
	const journal = join(tempDir(t), 'journal');
	const rebuilder = createRebuilder({
		command: `"${process.execPath}" "${FAKE_REBUILD}"`,
		env: { ...process.env, FAKE_REBUILD_MS: '300', FAKE_REBUILD_JOURNAL: journal }
	});

	const first = rebuilder.trigger();
	assert.equal(first.started, true);
	assert.equal(first.rebuild.status, 'running');
	for (let i = 0; i < 5; i++) {
		const again = rebuilder.trigger();
		assert.equal(again.started, false);
		assert.equal(again.queued, true);
	}

	const done = await rebuilder.idle();
	assert.equal(done.status, 'ok');
	assert.equal(done.runs, 2, 'five triggers during the run → exactly one more run');
	assert.equal(done.queued, false);

	const events = journalEvents(journal);
	assert.deepEqual(
		events.map(({ event }) => event),
		['start', 'end', 'start', 'end']
	);
	assert.ok(events[2].at >= events[1].at, 'the follow-up starts after the first run ended');

	// idle again: the next trigger starts at once
	assert.equal(rebuilder.trigger().started, true);
	assert.equal((await rebuilder.idle()).runs, 3);
});

test('a failing command ends as fail with its exit code and output', async () => {
	const rebuilder = createRebuilder({ command: 'echo building; echo boom >&2; exit 3' });
	rebuilder.trigger();
	const done = await rebuilder.idle();
	assert.equal(done.status, 'fail');
	assert.equal(done.exitCode, 3);
	assert.match(done.log, /^\$ echo building/);
	assert.match(done.log, /building\nboom\n/);
	assert.match(done.log, /ошибка: код 3/);
	assert.ok(done.startedAt && done.finishedAt);
});

test('a command that cannot start ends as fail instead of hanging', async () => {
	const rebuilder = createRebuilder({ command: 'true', cwd: '/nonexistent/site-admin-test' });
	rebuilder.trigger();
	const done = await rebuilder.idle();
	assert.equal(done.status, 'fail');
	assert.match(done.log, /Не удалось запустить/);
});

test('the log keeps a bounded tail, without colours or carriage returns', async () => {
	const rebuilder = createRebuilder({
		command: `printf '\\033[32mgreen\\033[0m\\r\\nprogress 1\\rprogress 2\\n'; i=0; while [ $i -lt 3000 ]; do echo "line $i"; i=$((i+1)); done`,
		maxLogChars: 2000
	});
	rebuilder.trigger();
	const { log, status } = await rebuilder.idle();
	assert.equal(status, 'ok');
	assert.ok(log.length <= 2000, `log is ${log.length} chars`);
	assert.ok(log.startsWith('…\nline '), 'cut at a line boundary');
	assert.match(log, /line 2999\n/);
	assert.ok(!log.includes('\u001b'));

	const short = createRebuilder({
		command: `printf '\\033[32mgreen\\033[0m\\r\\nprogress 1\\rprogress 2\\n'`
	});
	short.trigger();
	assert.match((await short.idle()).log, /green\nprogress 1\nprogress 2\n/);
});

test('a run past its timeout is stopped with its whole process group', async (t) => {
	const pidFile = join(tempDir(t), 'pid');
	const rebuilder = createRebuilder({
		command: `sleep 30 & echo $! > "${pidFile}"; wait`,
		timeoutMs: 300,
		killGraceMs: 300
	});
	const started = Date.now();
	rebuilder.trigger();
	const done = await rebuilder.idle();
	assert.equal(done.status, 'fail');
	assert.ok(Date.now() - started < 5000, 'stopped well before the command would end');
	assert.match(done.log, /останавливаю/);
	const grandchild = Number(readFileSync(pidFile, 'utf8'));
	await new Promise((resolve) => setTimeout(resolve, 100));
	assert.equal(isAlive(grandchild), false, 'the background sleep died with the group');
});

test('the rebuild command never sees the admin token', () => {
	const env = childEnv(
		{ PATH: '/usr/bin', SITE_ADMIN_TOKEN: 'secret-secret-secret', HOME: '/root' },
		{ configPath: '/var/lib/site-admin/site-config.json' }
	);
	assert.equal('SITE_ADMIN_TOKEN' in env, false);
	assert.equal(env.SITE_CONFIG_PATH, '/var/lib/site-admin/site-config.json');
	assert.equal(env.PATH, '/usr/bin');
});
