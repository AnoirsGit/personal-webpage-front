#!/usr/bin/env bash
# Installs or updates the box side of personal-webpage-front from this checkout. Run it as
# root from a checkout of main (the deploy's own, /srv/www/personal-webpage/repo, will do):
#
#   ops/box/install.sh             install or update everything below
#   ops/box/install.sh --dry-run   only print what would change
#   ops/box/install.sh --no-caddy  leave /etc/caddy/Caddyfile alone
#
# Idempotent: a file is written only when its content, mode or owner differ, a service is
# restarted only when something it runs changed, and every change is printed. The token in
# /etc/site-admin/env is generated once and never printed or replaced.
#
#   /opt/personal-webpage/deploy.sh         ops/box/deploy.sh (root cron, daily 04:30 UTC)
#   /opt/personal-webpage/site-rebuild.sh   ops/box/site-rebuild.sh (run by site-rebuild.service)
#   /opt/personal-webpage/README.md         ops/box/README.md
#   /etc/logrotate.d/personal-webpage       ops/box/logrotate.conf
#   /usr/local/lib/site-admin/              tools/site-admin + the countries file + the repo's
#                                           site-config.json; a copy, because every deploy
#                                           resets the checkout under the running admin
#   /etc/site-admin/env                     created once: SITE_ADMIN_TOKEN; the allowed Host
#                                           names (loopback, this box's tailnet name and
#                                           address, read from tailscale) are kept complete
#   /etc/systemd/system/site-admin.service  ops/box/site-admin.service (127.0.0.1:8792)
#   /etc/systemd/system/site-rebuild.path   ops/box/site-rebuild.path (watches the admin's saves)
#   /etc/systemd/system/site-rebuild.service ops/box/site-rebuild.service (root, runs deploy.sh)
#   /etc/caddy/Caddyfile                    ops/box/Caddyfile (validated; restored if the
#                                           reload fails)
# and removes /etc/sudoers.d/site-admin, which an earlier version created.
set -euo pipefail
umask 022

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO=$(cd "$HERE/../.." && pwd)
PORT=8792
DEPLOY_LOCK=/var/lock/personal-webpage-deploy.lock
UNITS=/etc/systemd/system

DRY=0
CADDY=1
for arg in "$@"; do
	case "$arg" in
	--dry-run) DRY=1 ;;
	--no-caddy) CADDY=0 ;;
	-h | --help)
		sed -n '2,28p' "$0"
		exit 0
		;;
	*)
		echo "install.sh: unknown option $arg" >&2
		exit 2
		;;
	esac
done

die() {
	echo "install.sh: $*" >&2
	exit 1
}
[ "$(id -u)" -eq 0 ] || die "run as root"
[ -f "$REPO/tools/site-admin/server.js" ] || die "run it from a checkout of the repo"
for tool in node pnpm git flock curl systemctl runuser cmp mktemp crontab stat; do
	command -v "$tool" >/dev/null || die "$tool is missing"
done
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || die "node 20+ is needed"

# Hold the deploy lock throughout, so no deploy resets this checkout while it is copied.
if [ "$DRY" -eq 0 ]; then
	exec 8>"$DEPLOY_LOCK"
	if ! flock -n 8; then
		echo "a deploy is running; waiting for it (up to 30 min)"
		flock -w 1800 8 || die "the deploy did not finish in 30 min"
	fi
fi

CHANGES=0
changed() {
	CHANGES=$((CHANGES + 1))
	if [ "$DRY" -eq 1 ]; then echo "  would change: $*"; else echo "  changed: $*"; fi
}
note() { echo "  $*"; }
run() { if [ "$DRY" -eq 0 ]; then "$@"; fi; }

# put SRC DST MODE OWNER:GROUP — succeeds (0) when DST was (or would be) written.
put() {
	local src=$1 dst=$2 mode=$3 owner=$4 tmp
	if [ -f "$dst" ] && [ ! -L "$dst" ] && cmp -s "$src" "$dst" &&
		[ "$(stat -c '%a %U:%G' "$dst")" = "$mode $owner" ]; then
		return 1
	fi
	changed "$dst"
	if [ "$DRY" -eq 0 ]; then
		mkdir -p "$(dirname "$dst")"
		tmp=$(mktemp "$dst.XXXXXX")
		cat "$src" >"$tmp"
		chmod "$mode" "$tmp"
		chown "$owner" "$tmp"
		mv -f "$tmp" "$dst"
	fi
}

# "name,name:8792,100.x.y.z,100.x.y.z:8792": this box on the tailnet, if it is on one. Its
# userspace tailscaled hands tailnet connections to 127.0.0.1, so the admin is reached
# under these names without listening anywhere else. Kept out of the repo on purpose.
tailnet_hosts() {
	command -v tailscale >/dev/null || return 0
	tailscale status --json 2>/dev/null | PORT=$PORT node -e '
		let raw = "";
		process.stdin.on("data", (chunk) => (raw += chunk));
		process.stdin.on("end", () => {
			try {
				const self = JSON.parse(raw).Self || {};
				const name = String(self.DNSName || "").split(".")[0];
				const ip = (self.TailscaleIPs || []).find((a) => /^\d+(\.\d+){3}$/.test(a));
				const hosts = [];
				for (const host of [name, ip]) if (host) hosts.push(host, `${host}:${process.env.PORT}`);
				process.stdout.write(hosts.join(","));
			} catch {}
		});' || true
}

echo "deploy"
put "$HERE/deploy.sh" /opt/personal-webpage/deploy.sh 755 root:root || :
put "$HERE/README.md" /opt/personal-webpage/README.md 644 root:root || :
put "$HERE/logrotate.conf" /etc/logrotate.d/personal-webpage 644 root:root || :
CRON_LINE='30 4 * * * /opt/personal-webpage/deploy.sh >> /var/log/personal-webpage-deploy.log 2>&1'
if crontab -l 2>/dev/null | grep -qF '/opt/personal-webpage/deploy.sh'; then
	note "root cron already runs deploy.sh"
else
	changed "root crontab: $CRON_LINE"
	if [ "$DRY" -eq 0 ]; then { crontab -l 2>/dev/null || true; echo "$CRON_LINE"; } | crontab -; fi
fi
[ "$(date +%Z)" = UTC ] || note "the box clock is not UTC: cron runs deploy.sh at 04:30 $(date +%Z)"
if [ -f /opt/personal-webpage/svelte.config.js ]; then
	note "unused now: /opt/personal-webpage/svelte.config.js (the old adapter overlay)"
fi

echo "place admin"
RELOAD=0
RESTART_ADMIN=0
if ! id -u site-admin >/dev/null 2>&1; then
	changed "system user site-admin"
	run useradd --system --user-group --home-dir /var/lib/site-admin --no-create-home \
		--shell /usr/sbin/nologin site-admin
	RESTART_ADMIN=1
fi

ADMIN_LIB=/usr/local/lib/site-admin
FILES=(tools/site-admin/package.json tools/site-admin/server.js tools/site-admin/apply-config.js)
for file in "$REPO"/tools/site-admin/lib/*.js "$REPO"/tools/site-admin/public/*; do
	FILES+=("${file#"$REPO"/}")
done
FILES+=(src/lib/ne_110m_admin_0_countries.geojson src/lib/config/site-config.json)
for file in "${FILES[@]}"; do
	if put "$REPO/$file" "$ADMIN_LIB/$file" 644 root:root; then RESTART_ADMIN=1; fi
done
if [ -d "$ADMIN_LIB" ]; then
	while IFS= read -r -d '' installed; do
		keep=0
		for file in "${FILES[@]}"; do
			if [ "$ADMIN_LIB/$file" = "$installed" ]; then keep=1 && break; fi
		done
		if [ "$keep" -eq 0 ]; then
			changed "removed $installed (no longer in the repo)"
			run rm -f "$installed"
			RESTART_ADMIN=1
		fi
	done < <(find "$ADMIN_LIB" -type f -print0)
fi

ENV_FILE=/etc/site-admin/env
HOSTS="127.0.0.1:$PORT,localhost:$PORT"
TAILNET=$(tailnet_hosts)
if [ -n "$TAILNET" ]; then
	HOSTS="$HOSTS,$TAILNET"
else
	note "no tailnet found (tailscale status): the admin answers on loopback names only"
fi
if [ -f "$ENV_FILE" ]; then
	note "$ENV_FILE exists: token kept"
	# add allowed names that are missing; keep the ones added by hand
	merged=$(ENV_FILE=$ENV_FILE HOSTS=$HOSTS node -e '
		const fs = require("fs");
		const wanted = process.env.HOSTS.split(",");
		const lines = fs.readFileSync(process.env.ENV_FILE, "utf8").replace(/\n$/, "").split("\n");
		let found = false;
		let changed = false;
		const out = lines.map((line) => {
			const match = /^SITE_ADMIN_ALLOWED_HOSTS=(.*)$/.exec(line);
			if (!match) return line;
			found = true;
			const have = match[1].split(",").map((host) => host.trim()).filter(Boolean);
			const missing = wanted.filter((host) => !have.includes(host));
			if (!missing.length) return line;
			changed = true;
			return `SITE_ADMIN_ALLOWED_HOSTS=${have.concat(missing).join(",")}`;
		});
		if (!found) {
			out.push(`SITE_ADMIN_ALLOWED_HOSTS=${wanted.join(",")}`);
			changed = true;
		}
		if (changed) process.stdout.write(`${out.join("\n")}\n`);')
	if [ -n "$merged" ]; then
		changed "$ENV_FILE: allowed host names completed (token kept)"
		if [ "$DRY" -eq 0 ]; then
			tmp=$(mktemp "$ENV_FILE.XXXXXX")
			printf '%s' "$merged" >"$tmp"
			chown root:site-admin "$tmp"
			chmod 640 "$tmp"
			mv -f "$tmp" "$ENV_FILE"
		fi
		RESTART_ADMIN=1
	fi
	if [ -f "$ENV_FILE" ] && [ "$(stat -c '%a %U:%G' "$ENV_FILE")" != "640 root:site-admin" ]; then
		changed "$ENV_FILE owner and mode → root:site-admin 0640"
		run chown root:site-admin "$ENV_FILE"
		run chmod 640 "$ENV_FILE"
	fi
else
	changed "$ENV_FILE (a new random token; read it with: cat $ENV_FILE)"
	if [ "$DRY" -eq 0 ]; then
		mkdir -p /etc/site-admin
		chmod 755 /etc/site-admin
		tmp=$(mktemp "$ENV_FILE.XXXXXX")
		chown root:site-admin "$tmp"
		chmod 640 "$tmp"
		{
			echo "# site-admin.service: the admin's token and the Host names it answers to."
			echo "# Created by ops/box/install.sh; not in git. Restart the service after an edit."
			echo "SITE_ADMIN_TOKEN=$(head -c 24 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=\n')"
			echo "SITE_ADMIN_ALLOWED_HOSTS=$HOSTS"
		} >"$tmp"
		mv -f "$tmp" "$ENV_FILE"
	fi
	RESTART_ADMIN=1
fi

if [ -e /etc/sudoers.d/site-admin ]; then
	changed "removed /etc/sudoers.d/site-admin (the admin no longer runs anything as root)"
	run rm -f /etc/sudoers.d/site-admin
fi

if put "$HERE/site-admin.service" "$UNITS/site-admin.service" 644 root:root; then
	RELOAD=1
	RESTART_ADMIN=1
fi

echo "rebuild on save"
RESTART_PATH=0
put "$HERE/site-rebuild.sh" /opt/personal-webpage/site-rebuild.sh 755 root:root || :
if put "$HERE/site-rebuild.service" "$UNITS/site-rebuild.service" 644 root:root; then RELOAD=1; fi
if put "$HERE/site-rebuild.path" "$UNITS/site-rebuild.path" 644 root:root; then
	RELOAD=1
	RESTART_PATH=1
fi

if [ "$DRY" -eq 0 ]; then
	[ "$RELOAD" -eq 0 ] || systemctl daemon-reload
	for unit in site-admin.service site-rebuild.path; do
		if ! systemctl is-enabled --quiet "$unit" 2>/dev/null; then
			changed "enabled $unit"
			systemctl enable --quiet "$unit"
		fi
	done
	if [ "$RESTART_ADMIN" -eq 1 ] || ! systemctl is-active --quiet site-admin; then
		systemctl restart site-admin
		changed "restarted site-admin.service"
	fi
	if [ "$RESTART_PATH" -eq 1 ] || ! systemctl is-active --quiet site-rebuild.path; then
		systemctl restart site-rebuild.path
		changed "started site-rebuild.path"
	fi
	code=000
	for _ in 1 2 3 4 5 6 7 8 9 10; do
		code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" || true)
		[ "$code" = 000 ] || break
		sleep 0.5
	done
	[ "$code" = 401 ] || die "site-admin answers HTTP $code instead of 401; see journalctl -u site-admin"
	note "site-admin answers on 127.0.0.1:$PORT (401 without the token, as it should)"
	systemctl is-active --quiet site-rebuild.path || die "site-rebuild.path is not active"
	note "site-rebuild.path watches the admin's saves"
fi

LIVE=/srv/www/personal-webpage/current
if [ "$CADDY" -eq 1 ]; then
	echo "caddy"
	CADDYFILE=/etc/caddy/Caddyfile
	if [ -f "$CADDYFILE" ] && cmp -s "$HERE/Caddyfile" "$CADDYFILE"; then
		note "$CADDYFILE is current"
	elif [ ! -f "$LIVE/404.html" ]; then
		# the new config has no SPA fallback: switch only once a static build is live
		note "skipped: the live release predates the static build (no 404.html)."
		note "run /opt/personal-webpage/deploy.sh --force, then this script again"
	else
		changed "$CADDYFILE ← ops/box/Caddyfile"
		if [ "$DRY" -eq 0 ]; then
			# validate as caddy: as root it would create log files the service cannot open
			candidate=$(mktemp /tmp/Caddyfile.XXXXXX)
			cat "$HERE/Caddyfile" >"$candidate"
			chmod 644 "$candidate"
			caddy_home=$(getent passwd caddy | cut -d: -f6)
			if ! runuser -u caddy -- env HOME="${caddy_home:-/var/lib/caddy}" \
				caddy validate --config "$candidate" --adapter caddyfile >/dev/null 2>&1; then
				rm -f "$candidate"
				die "ops/box/Caddyfile does not validate; $CADDYFILE untouched"
			fi
			backup="$CADDYFILE.bak-$(date +%Y%m%d-%H%M%S)"
			[ -f "$CADDYFILE" ] && cp -p "$CADDYFILE" "$backup"
			install -m 644 -o root -g root "$candidate" "$CADDYFILE"
			rm -f "$candidate"
			if ! systemctl reload caddy; then
				[ -f "$backup" ] && cp -p "$backup" "$CADDYFILE"
				systemctl reload caddy || true
				die "caddy refused the new config; restored $backup"
			fi
			chown -R caddy:caddy /var/log/caddy 2>/dev/null || true
			note "previous config: $backup"
		fi
	fi
	if [ "$DRY" -eq 0 ]; then
		home=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/ || true)
		missing=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/no-such-page-$$" || true)
		note "http://127.0.0.1/ → $home, a missing page → $missing (want 200 and 404)"
	fi
fi

echo
if [ "$CHANGES" -eq 0 ]; then
	echo "nothing to change"
elif [ "$DRY" -eq 1 ]; then
	echo "$CHANGES change(s) would be made (dry run: nothing written)"
else
	echo "$CHANGES change(s) made"
fi
name=${TAILNET%%,*}
echo "admin: open once with ?token=<SITE_ADMIN_TOKEN from $ENV_FILE>"
[ -z "$name" ] || echo "       http://$name:$PORT/ from the owner's tailnet devices"
echo "       or: ssh -L $PORT:127.0.0.1:$PORT root@<box>, then http://127.0.0.1:$PORT/"
