/*
 * Runs the rebuild command (SITE_REBUILD_CMD, through /bin/sh) one at a time.
 *
 * Single flight: a trigger while a run is in progress does not start a second process; it
 * marks one follow-up run, which starts when the current one ends, so the last saved config
 * is always the one that gets built. Any number of triggers during a run collapse into that
 * one follow-up.
 *
 * The merged stdout/stderr of the current run is kept as a tail of `maxLogChars` (ANSI
 * colours stripped, carriage returns turned into newlines) for the page to show live. A run
 * that outlives `timeoutMs` gets SIGTERM, then SIGKILL, sent to its process group; it counts
 * as finished only when the process has really exited, so two runs never overlap.
 */
import { spawn } from 'node:child_process';

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g;

const cleanOutput = (text) => text.replace(ANSI, '').replace(/\r\n?/g, '\n');

const duration = (ms) => {
	const seconds = Math.round(ms / 1000);
	return seconds < 60 ? `${seconds} с` : `${Math.floor(seconds / 60)} мин ${seconds % 60} с`;
};

/**
 * @param {{
 *   command: string,
 *   cwd?: string,
 *   env?: NodeJS.ProcessEnv,
 *   timeoutMs?: number,
 *   killGraceMs?: number,
 *   maxLogChars?: number,
 *   onFinish?: (snapshot: object) => void
 * }} options
 */
export const createRebuilder = ({
	command,
	cwd,
	env = process.env,
	timeoutMs = 30 * 60 * 1000,
	killGraceMs = 10 * 1000,
	maxLogChars = 64 * 1024,
	onFinish
}) => {
	const state = {
		status: 'idle', // idle | running | ok | fail
		queued: false,
		runs: 0,
		startedAt: null,
		finishedAt: null,
		exitCode: null,
		signal: null,
		log: ''
	};
	let waiters = [];

	const append = (text) => {
		state.log += cleanOutput(text);
		if (state.log.length > maxLogChars) {
			const cut = state.log.length - maxLogChars;
			const lineStart = state.log.indexOf('\n', cut);
			state.log = `…\n${state.log.slice(lineStart === -1 ? cut : lineStart + 1)}`;
		}
	};

	const settleWaiters = () => {
		const ready = waiters;
		waiters = [];
		for (const resolve of ready) resolve(snapshot());
	};

	const start = () => {
		const startedMs = Date.now();
		Object.assign(state, {
			status: 'running',
			runs: state.runs + 1,
			startedAt: new Date(startedMs).toISOString(),
			finishedAt: null,
			exitCode: null,
			signal: null,
			log: ''
		});
		append(`$ ${command}\n`);

		let finished = false;
		let termTimer = null;
		let killTimer = null;
		let child;

		const finish = (exitCode, signal, error) => {
			if (finished) return;
			finished = true;
			clearTimeout(termTimer);
			clearTimeout(killTimer);
			if (error) append(`\nНе удалось запустить команду: ${error.message}\n`);
			const ok = !error && exitCode === 0;
			Object.assign(state, {
				status: ok ? 'ok' : 'fail',
				exitCode: exitCode === undefined ? null : exitCode,
				signal: signal || null,
				finishedAt: new Date().toISOString()
			});
			const took = duration(Date.now() - startedMs);
			append(
				ok
					? `\n— готово за ${took}\n`
					: `\n— ошибка: ${signal ? `сигнал ${signal}` : `код ${exitCode}`}, через ${took}\n`
			);
			if (onFinish) onFinish(snapshot());
			if (state.queued) {
				state.queued = false;
				start();
				return;
			}
			settleWaiters();
		};

		const signalGroup = (signal) => {
			try {
				process.kill(-child.pid, signal);
			} catch {
				try {
					child.kill(signal);
				} catch {
					// already gone, or not ours to signal (a root process behind sudo)
				}
			}
		};

		try {
			child = spawn('/bin/sh', ['-c', command], {
				cwd,
				env,
				stdio: ['ignore', 'pipe', 'pipe'],
				detached: true // own process group, so a timeout reaches the whole tree
			});
		} catch (error) {
			finish(null, null, error);
			return;
		}
		child.stdout.setEncoding('utf8');
		child.stderr.setEncoding('utf8');
		child.stdout.on('data', append);
		child.stderr.on('data', append);
		child.on('error', (error) => finish(null, null, error));
		child.on('close', (exitCode, signal) => finish(exitCode, signal));

		termTimer = setTimeout(() => {
			append(`\n— дольше ${duration(timeoutMs)}: останавливаю (SIGTERM)\n`);
			signalGroup('SIGTERM');
			killTimer = setTimeout(() => signalGroup('SIGKILL'), killGraceMs);
		}, timeoutMs);
	};

	const snapshot = () => ({ ...state });

	return {
		/** Starts a run, or books one follow-up run if one is in progress. */
		trigger() {
			if (state.status === 'running') {
				state.queued = true;
				return { started: false, queued: true, rebuild: snapshot() };
			}
			start();
			return { started: true, queued: false, rebuild: snapshot() };
		},
		snapshot,
		/** Resolves when nothing is running and nothing is queued. */
		idle() {
			if (state.status !== 'running') return Promise.resolve(snapshot());
			return new Promise((resolve) => waiters.push(resolve));
		}
	};
};
