/*
 * The admin's HTTP surface. Everything answers only to an allowed Host; everything but the
 * token exchange needs the session cookie; every POST also needs a same-origin Origin.
 *
 *   GET  /?token=…     check the token, set the cookie, move on to / (token leaves the URL)
 *   GET  /             the page (public/index.html, CSP with a per-response nonce)
 *   GET  /api/state    saved config (or the repo default), countries, rebuild status
 *   GET  /api/rebuild  rebuild status and log tail (the page polls it during a run)
 *   POST /api/preview  { home } → normalized config, field errors, warnings; writes nothing
 *   POST /api/config   { home } → validate, write SITE_CONFIG_PATH atomically, trigger rebuild
 *   POST /api/rebuild  run the rebuild again without a change
 */
import { randomBytes } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import {
	hostAllowed,
	isAuthenticated,
	originAllowed,
	safeEqual,
	sessionCookie,
	sessionValue
} from './auth.js';
import { loadCountries, resolveCountry, toPublic } from './countries.js';
import { readJsonFile, serializeConfig, validateConfig, writeFileAtomic } from './config.js';
import { createRebuilder } from './rebuild.js';

const BODY_LIMIT = 16 * 1024;

const BASE_HEADERS = {
	'Cache-Control': 'no-store',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Resource-Policy': 'same-origin',
	'Referrer-Policy': 'no-referrer',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY'
};

const csp = (nonce) =>
	[
		"default-src 'none'",
		`script-src 'nonce-${nonce}'`,
		`style-src 'nonce-${nonce}'`,
		"connect-src 'self'",
		"img-src 'self' data:",
		"base-uri 'none'",
		"form-action 'self'",
		"frame-ancestors 'none'"
	].join('; ');

class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

const send = (res, status, body, headers = {}) => {
	res.writeHead(status, { ...BASE_HEADERS, ...headers });
	res.end(body);
};

const sendJson = (res, status, value) =>
	send(res, status, JSON.stringify(value), { 'Content-Type': 'application/json; charset=utf-8' });

const sendHtml = (res, status, html, nonce, headers = {}) =>
	send(res, status, html, {
		'Content-Type': 'text/html; charset=utf-8',
		'Content-Security-Policy': csp(nonce),
		...headers
	});

const escapeHtml = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])
	);

/** The small pages around the app: no token, wrong token, token accepted. */
const notePage = (nonce, { title, text, redirect = false }) => `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
${redirect ? '<meta http-equiv="refresh" content="0; url=/">' : ''}
<title>${escapeHtml(title)} · Админка места</title>
<style nonce="${nonce}">
	html { color-scheme: dark; }
	body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box;
		background: #05060d; color: #eef0f8; font: 16px/1.55 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
	main { max-width: 460px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 28px;
		background: rgba(255, 255, 255, 0.02); }
	h1 { margin: 0 0 8px; font-size: 22px; letter-spacing: -0.01em; }
	p { margin: 0; color: #a9aec4; }
	code { color: #e8c77e; }
	a { color: #e8c77e; }
</style>
${redirect ? `<script nonce="${nonce}">location.replace('/');</script>` : ''}
</head>
<body><main><h1>${escapeHtml(title)}</h1><p>${text}</p></main></body>
</html>
`;

const readBody = (req) =>
	new Promise((resolve, reject) => {
		const declared = Number(req.headers['content-length']);
		if (declared > BODY_LIMIT) {
			reject(new HttpError(413, 'Слишком большой запрос'));
			req.resume();
			return;
		}
		const chunks = [];
		let size = 0;
		let tooLarge = false;
		req.on('data', (chunk) => {
			size += chunk.length;
			if (size > BODY_LIMIT) tooLarge = true;
			else chunks.push(chunk);
		});
		req.on('end', () =>
			tooLarge
				? reject(new HttpError(413, 'Слишком большой запрос'))
				: resolve(Buffer.concat(chunks).toString('utf8'))
		);
		req.on('error', reject);
	});

const readJsonBody = async (req) => {
	const type = String(req.headers['content-type'] || '')
		.split(';')[0]
		.trim()
		.toLowerCase();
	if (type !== 'application/json') throw new HttpError(415, 'Нужен Content-Type: application/json');
	const raw = await readBody(req);
	try {
		return JSON.parse(raw);
	} catch {
		throw new HttpError(400, 'Тело запроса — не JSON');
	}
};

/** The rebuild command's environment: the admin's, minus its secret. */
export const childEnv = (env, settings) => {
	const result = { ...env, SITE_CONFIG_PATH: settings.configPath };
	delete result.SITE_ADMIN_TOKEN;
	return result;
};

/**
 * @param {ReturnType<typeof import('./settings.js').loadSettings>} settings
 * @param {{ log?: (line: string) => void, env?: NodeJS.ProcessEnv }} [options]
 */
export const createAdmin = (settings, { log = console.log, env = process.env } = {}) => {
	const countries = loadCountries(settings.countriesPath);
	const publicCountries = countries.map(toPublic);
	const page = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
	const expectedSession = sessionValue(settings.token);

	const rebuilder = settings.rebuildCommand
		? createRebuilder({
				command: settings.rebuildCommand,
				env: childEnv(env, settings),
				timeoutMs: settings.rebuildTimeoutMs,
				onFinish: (run) =>
					log(`rebuild #${run.runs} ${run.status} (exit ${run.exitCode ?? run.signal})`)
		  })
		: null;

	const rebuildState = () =>
		rebuilder
			? { configured: true, ...rebuilder.snapshot() }
			: { configured: false, status: 'idle', queued: false, runs: 0, log: '' };

	const currentConfig = async () => {
		let saved = null;
		let savedError = null;
		try {
			saved = await readJsonFile(settings.configPath);
		} catch (error) {
			// only a hand edit can do this (saves are atomic); show the default and say so
			savedError = `${settings.configPath} не читается: ${error.message}`;
			log(`saved config unreadable: ${error.message}`);
		}
		if (saved && typeof saved === 'object') {
			let savedAt = null;
			try {
				savedAt = statSync(settings.configPath).mtime.toISOString();
			} catch {
				// raced with a write; the time is cosmetic
			}
			return { config: saved, source: 'saved', savedAt };
		}
		const fallback = (await readJsonFile(settings.defaultConfigPath)) || {};
		return {
			config: { home: fallback.home || null },
			source: 'default',
			savedAt: null,
			savedError
		};
	};

	// saves run one after another, so the file on disk and the rebuild order agree
	let saving = Promise.resolve();
	const save = (config) => {
		const run = saving.then(async () => {
			await mkdir(dirname(settings.configPath), { recursive: true });
			await writeFileAtomic(settings.configPath, serializeConfig(config), { mode: 0o644 });
			const trigger = rebuilder ? rebuilder.trigger() : null;
			return { savedAt: new Date().toISOString(), trigger };
		});
		saving = run.catch(() => {});
		return run;
	};

	const api = async (req, res, path) => {
		if (req.method === 'GET' || req.method === 'HEAD') {
			if (path === '/api/state') {
				const current = await currentConfig();
				const country = resolveCountry(countries, current.config.home?.countryIso3);
				return sendJson(res, 200, {
					...current,
					countryCode: country ? country.code : null,
					configPath: settings.configPath,
					countries: publicCountries,
					rebuild: rebuildState()
				});
			}
			if (path === '/api/rebuild') return sendJson(res, 200, { rebuild: rebuildState() });
			throw new HttpError(404, 'Нет такого адреса');
		}
		if (req.method !== 'POST') throw new HttpError(405, 'Метод не поддерживается');
		if (!originAllowed(req.headers, settings.allowedHosts)) {
			throw new HttpError(403, 'Запрос не с этой страницы (Origin)');
		}

		if (path === '/api/preview') {
			return sendJson(res, 200, validateConfig(await readJsonBody(req), { countries }));
		}
		if (path === '/api/config') {
			const result = validateConfig(await readJsonBody(req), { countries });
			if (!result.ok) return sendJson(res, 422, result);
			const { savedAt, trigger } = await save(result.config);
			const { home } = result.config;
			log(
				`saved ${home.countryIso3} ${home.city.en} ${home.lat},${home.lon} ${home.timezone}` +
					(trigger ? ` → rebuild ${trigger.queued ? 'queued' : 'started'}` : '')
			);
			return sendJson(res, 200, {
				ok: true,
				config: result.config,
				warnings: result.warnings,
				source: 'saved',
				savedAt,
				rebuild: rebuildState()
			});
		}
		if (path === '/api/rebuild') {
			if (!rebuilder) throw new HttpError(409, 'Команда пересборки не задана (SITE_REBUILD_CMD)');
			const trigger = rebuilder.trigger();
			log(`rebuild ${trigger.queued ? 'queued' : 'started'} by hand`);
			return sendJson(res, 202, { rebuild: rebuildState() });
		}
		throw new HttpError(404, 'Нет такого адреса');
	};

	const handle = async (req, res) => {
		if (!hostAllowed(req.headers, settings.allowedHosts)) {
			return send(res, 403, 'Host not allowed\n', { 'Content-Type': 'text/plain; charset=utf-8' });
		}
		const url = new URL(req.url || '/', 'http://admin.invalid');
		const path = url.pathname;
		const nonce = randomBytes(16).toString('base64');

		if (path === '/') {
			if (req.method !== 'GET' && req.method !== 'HEAD') {
				return send(res, 405, '', { Allow: 'GET, HEAD' });
			}
			if (url.searchParams.has('token')) {
				if (!safeEqual(url.searchParams.get('token'), settings.token)) {
					log('wrong token presented');
					return sendHtml(
						res,
						401,
						notePage(nonce, {
							title: 'Ключ не подошёл',
							text: 'Проверьте ссылку: нужен <code>?token=…</code> из <code>SITE_ADMIN_TOKEN</code>.'
						}),
						nonce
					);
				}
				const secure = req.headers['x-forwarded-proto'] === 'https';
				return sendHtml(
					res,
					200,
					notePage(nonce, {
						title: 'Вход выполнен',
						text: '<a href="/">Открыть админку</a>',
						redirect: true
					}),
					nonce,
					{ 'Set-Cookie': sessionCookie(expectedSession, { secure }) }
				);
			}
			if (!isAuthenticated(req.headers, expectedSession)) {
				return sendHtml(
					res,
					401,
					notePage(nonce, {
						title: 'Нужен ключ доступа',
						text: 'Откройте адрес админки с <code>?token=…</code> один раз — дальше браузер запомнит вход. Ключ — <code>SITE_ADMIN_TOKEN</code> в env-файле админки на сервере.'
					}),
					nonce
				);
			}
			return sendHtml(res, 200, page.replace(/__NONCE__/g, nonce), nonce);
		}

		if (path.startsWith('/api/')) {
			if (!isAuthenticated(req.headers, expectedSession)) {
				return sendJson(res, 401, { error: 'Нужен вход: откройте админку с ?token=…' });
			}
			return api(req, res, path);
		}
		return send(res, 404, 'Not found\n', { 'Content-Type': 'text/plain; charset=utf-8' });
	};

	const server = createServer((req, res) => {
		handle(req, res).catch((error) => {
			const status = error instanceof HttpError ? error.status : 500;
			if (status === 500) log(`error: ${error.stack || error}`);
			if (res.headersSent) return res.destroy();
			sendJson(res, status, { error: status === 500 ? 'Внутренняя ошибка' : error.message });
		});
	});
	server.headersTimeout = 10 * 1000;
	server.requestTimeout = 30 * 1000;

	return { server, rebuilder, countries };
};
