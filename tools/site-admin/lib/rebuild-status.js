/*
 * The rebuild as the admin sees it. The admin starts nothing and needs no rights: a save
 * rewrites SITE_CONFIG_PATH and "rebuild again" rewrites SITE_REBUILD_REQUEST_PATH. On the
 * box site-rebuild.path watches both files and starts site-rebuild.service, which runs
 * ops/box/site-rebuild.sh as root. That script owns the status directory and writes
 *
 *   status.json   {"status":"running"|"ok"|"fail","pass":1,"startedAt":"<ISO>",
 *                  "finishedAt":"<ISO>"|null,"exitCode":0|null}
 *   rebuild.log   the deploy output of the current or the last run
 *
 * both 0644 in a root-owned directory, so nothing the admin writes can redirect them. This
 * module reads them back (a bounded tail of the log) and works out whether the latest save
 * or request still waits for a run to start (`pendingSince`) or will get one more pass
 * after the running one (`queued`): the script repeats its pass while those files change.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const STATUSES = new Set(['running', 'ok', 'fail']);
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g;

export const cleanLog = (text) => text.replace(ANSI, '').replace(/\r\n?/g, '\n');

const mtimeMs = async (path) => {
	try {
		return (await fs.stat(path)).mtimeMs;
	} catch {
		return 0;
	}
};

/** The last `maxBytes` of a text file, cut to whole lines ('' when it does not exist). */
export const readTail = async (path, maxBytes) => {
	let handle;
	try {
		handle = await fs.open(path, 'r');
	} catch {
		return '';
	}
	try {
		const { size } = await handle.stat();
		const start = Math.max(0, size - maxBytes);
		const buffer = Buffer.alloc(size - start);
		await handle.read(buffer, 0, buffer.length, start);
		let text = buffer.toString('utf8');
		if (start > 0) {
			const newline = text.indexOf('\n');
			text = `…\n${newline === -1 ? text : text.slice(newline + 1)}`;
		}
		return cleanLog(text);
	} finally {
		await handle.close();
	}
};

const isoOrNull = (value) =>
	typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;

/**
 * @param {{ statusDir: string | null, triggers?: string[], maxLogBytes?: number }} options
 *   triggers: the files the path unit watches (the saved config, the rebuild request)
 */
export const readRebuildState = async ({ statusDir, triggers = [], maxLogBytes = 64 * 1024 }) => {
	if (!statusDir) {
		return { configured: false, status: 'idle', queued: false, pendingSince: null, log: '' };
	}
	let raw = null;
	try {
		raw = JSON.parse(await fs.readFile(join(statusDir, 'status.json'), 'utf8'));
	} catch {
		raw = null;
	}
	const valid = Boolean(raw) && typeof raw === 'object' && STATUSES.has(raw.status);
	const state = {
		configured: true,
		status: valid ? raw.status : 'idle',
		pass: valid && Number.isInteger(raw.pass) ? raw.pass : null,
		startedAt: valid ? isoOrNull(raw.startedAt) : null,
		finishedAt: valid ? isoOrNull(raw.finishedAt) : null,
		exitCode: valid && Number.isInteger(raw.exitCode) ? raw.exitCode : null,
		queued: false,
		pendingSince: null,
		log: await readTail(join(statusDir, 'rebuild.log'), maxLogBytes)
	};
	const lastTrigger = Math.max(0, ...(await Promise.all(triggers.map(mtimeMs))));
	const started = state.startedAt ? Date.parse(state.startedAt) : 0;
	if (lastTrigger > started) {
		if (state.status === 'running') state.queued = true;
		else state.pendingSince = new Date(lastTrigger).toISOString();
	}
	return state;
};
