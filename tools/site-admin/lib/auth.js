/*
 * Who may talk to the admin.
 *
 * - Host: the Host header must be one of the allowed `host:port` names, exactly (case aside).
 *   That alone defeats DNS rebinding against the loopback port.
 * - Token: SITE_ADMIN_TOKEN (16+ characters) is presented once as `/?token=…`; the answer
 *   sets an HttpOnly, SameSite=Strict cookie holding an HMAC of the token (never the token).
 *   Every comparison is constant-time over SHA-256 digests, so neither content nor length
 *   leaks through timing.
 * - Writes: a POST must carry an Origin whose host is the request's own (allowed) host, and a
 *   Sec-Fetch-Site other than same-origin is refused when the browser sends one.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'site_admin';
export const TOKEN_MIN_LENGTH = 16;

const digest = (value) => createHash('sha256').update(value, 'utf8').digest();

/** Constant-time string equality (both sides hashed first, so lengths may differ). */
export const safeEqual = (a, b) =>
	typeof a === 'string' && typeof b === 'string' && timingSafeEqual(digest(a), digest(b));

/** The cookie value for a token: HMAC-SHA256 keyed by the token over a fixed label. */
export const sessionValue = (token) =>
	createHmac('sha256', token).update('site-admin session v1').digest('base64url');

export const parseCookies = (header) => {
	const cookies = {};
	if (typeof header !== 'string') return cookies;
	for (const part of header.split(';')) {
		const index = part.indexOf('=');
		if (index < 1) continue;
		const name = part.slice(0, index).trim();
		if (!name || name in cookies) continue;
		cookies[name] = part.slice(index + 1).trim();
	}
	return cookies;
};

export const sessionCookie = (value, { secure = false, maxAgeSec = 30 * 24 * 3600 } = {}) =>
	[
		`${COOKIE_NAME}=${value}`,
		'Path=/',
		`Max-Age=${maxAgeSec}`,
		'HttpOnly',
		'SameSite=Strict',
		secure ? 'Secure' : ''
	]
		.filter(Boolean)
		.join('; ');

export const isAuthenticated = (headers, expectedSession) =>
	safeEqual(parseCookies(headers.cookie)[COOKIE_NAME] || '', expectedSession);

const normalizeHost = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

/** "a:1, B:2" → Set {"a:1", "b:2"}; empty or missing → the loopback names for `port`. */
export const parseAllowedHosts = (value, port) => {
	const hosts = String(value || '')
		.split(',')
		.map(normalizeHost)
		.filter(Boolean);
	return new Set(hosts.length ? hosts : [`127.0.0.1:${port}`, `localhost:${port}`]);
};

export const hostAllowed = (headers, allowedHosts) => allowedHosts.has(normalizeHost(headers.host));

export const originAllowed = (headers, allowedHosts) => {
	const host = normalizeHost(headers.host);
	if (!allowedHosts.has(host)) return false;
	const fetchSite = headers['sec-fetch-site'];
	if (fetchSite !== undefined && fetchSite !== 'same-origin') return false;
	if (typeof headers.origin !== 'string') return false;
	let origin;
	try {
		origin = new URL(headers.origin);
	} catch {
		return false;
	}
	return (origin.protocol === 'http:' || origin.protocol === 'https:') && origin.host === host;
};
