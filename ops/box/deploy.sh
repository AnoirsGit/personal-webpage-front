#!/usr/bin/env bash
# Builds AnoirsGit/personal-webpage-front and deploys it to /srv/www/personal-webpage/current,
# the docroot Caddy serves. Lives in the repo as ops/box/deploy.sh; ops/box/install.sh copies
# it to /opt/personal-webpage/deploy.sh. Root's cron runs it daily at 04:30 UTC
# (>> /var/log/personal-webpage-deploy.log); after a save in the place admin,
# site-rebuild.service runs it through site-rebuild.sh.
#
#   deploy.sh                 deploy if origin/main or the saved place changed
#   deploy.sh --force         rebuild and redeploy even if nothing changed
#   deploy.sh --force --wait  the same, waiting for a running deploy instead of skipping
#                             (site-rebuild.sh)
#
# fetch main → apply the place the admin saved, if any → pnpm install --frozen-lockfile →
# pnpm build → copy build/ to releases/<time>-<sha> → swap `current` atomically → health
# check, rolling back to the previous release on failure → keep the last 5 releases.
# The repo builds exactly what is served (adapter-static in its own svelte.config.js), so
# there is no deploy-time overlay any more. A failed step leaves the live release alone.
#
# For a trial run elsewhere DEPLOY_ROOT, DEPLOY_BRANCH, DEPLOY_LOCK, DEPLOY_BUILD_LOG,
# DEPLOY_HEALTH_URL and SITE_CONFIG_PATH override the box defaults below.
set -euo pipefail
umask 022

ROOT=${DEPLOY_ROOT:-/srv/www/personal-webpage}
REPO=$ROOT/repo
RELEASES=$ROOT/releases
BRANCH=${DEPLOY_BRANCH:-main}
LOCK=${DEPLOY_LOCK:-/var/lock/personal-webpage-deploy.lock}
BUILD_LOG=${DEPLOY_BUILD_LOG:-/tmp/personal-webpage-build.log}
HEALTH_URL=${DEPLOY_HEALTH_URL:-http://127.0.0.1}
# written by the place admin (tools/site-admin, site-admin.service); absent until its first save
SITE_CONFIG_PATH=${SITE_CONFIG_PATH:-/var/lib/site-admin/site-config.json}
KEEP_RELEASES=5
MIN_FREE_MB=2048
LOCK_WAIT_SEC=1200

# cron and systemd hand over a bare environment; pnpm keeps its store under root's home
if [ "$(id -u)" -eq 0 ]; then export HOME=/root; fi
export PATH="/root/.local/share/pnpm:/usr/local/bin:/usr/bin:/bin${PATH:+:$PATH}"
export CI=1
# no TTY here: let pnpm rebuild node_modules instead of asking
export npm_config_confirm_modules_purge=false

log() { echo "[$(date -Is)] $*"; }
fail() {
	log "ERROR: $*"
	exit 1
}

FORCE=0
WAIT=0
for arg in "$@"; do
	case "$arg" in
	--force) FORCE=1 ;;
	--wait) WAIT=1 ;;
	-h | --help)
		sed -n '2,20p' "$0"
		exit 0
		;;
	*) fail "unknown option: $arg" ;;
	esac
done

# One deploy at a time: cron, the admin and a manual run must not build together.
exec 9>"$LOCK"
if ! flock -n 9; then
	[ "$WAIT" -eq 1 ] || {
		log "another deploy is running, skipping"
		exit 0
	}
	log "another deploy is running, waiting for it (up to ${LOCK_WAIT_SEC}s)"
	flock -w "$LOCK_WAIT_SEC" 9 || fail "the other deploy still holds the lock"
fi

# The saved place is part of what is deployed: a new save redeploys the same commit. Read
# without following symlinks: root reads a file an unprivileged service wrote.
CONFIG_SUM=$(node -e '
	const fs = require("fs");
	try {
		const fd = fs.openSync(process.argv[1], fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
		const data = fs.readFileSync(fd);
		console.log(require("crypto").createHash("sha256").update(data).digest("hex"));
	} catch (error) {
		console.log(error.code === "ENOENT" ? "none" : "unreadable");
	}' "$SITE_CONFIG_PATH")

cd "$REPO"
git fetch --quiet --prune origin
REMOTE_SHA=$(git rev-parse "origin/$BRANCH")
DEPLOYED_SHA=$(cat "$ROOT/.deployed_sha" 2>/dev/null || echo none)
DEPLOYED_CONFIG=$(cat "$ROOT/.deployed_config" 2>/dev/null || echo none)

if [ "$FORCE" -eq 0 ] && [ "$REMOTE_SHA" = "$DEPLOYED_SHA" ] &&
	[ "$CONFIG_SUM" = "$DEPLOYED_CONFIG" ] && [ -e "$ROOT/current" ]; then
	log "up to date at ${REMOTE_SHA:0:8}, nothing to do"
	exit 0
fi

# The box ran out of disk once before; a build needs room for node_modules + output.
FREE_MB=$(df -Pm "$ROOT" | awk 'NR==2 {print $4}')
[ "$FREE_MB" -ge "$MIN_FREE_MB" ] || fail "only ${FREE_MB}MB free on $ROOT, need ${MIN_FREE_MB}MB"

log "deploying ${DEPLOYED_SHA:0:8} -> ${REMOTE_SHA:0:8}"
git reset --quiet --hard "$REMOTE_SHA"
git clean -qfd # no -x: keeps node_modules and the build caches

if [ "$CONFIG_SUM" = none ]; then
	log "site config: the repo's own (nothing saved in the admin yet)"
else
	[ -f tools/site-admin/apply-config.js ] ||
		fail "$SITE_CONFIG_PATH is saved, but this commit has no tools/site-admin/apply-config.js"
	APPLIED=$(node tools/site-admin/apply-config.js "$SITE_CONFIG_PATH" src/lib/config/site-config.json 2>&1) ||
		fail "site config rejected: $APPLIED"
	log "site config applied: $APPLIED"
fi

: >"$BUILD_LOG"
log "installing dependencies (pnpm install --frozen-lockfile)"
pnpm install --frozen-lockfile 2>&1 | tee -a "$BUILD_LOG" || fail "pnpm install failed (log: $BUILD_LOG)"

rm -rf build
log "building (pnpm build)"
pnpm build 2>&1 | tee -a "$BUILD_LOG" || fail "build failed (log: $BUILD_LOG)"
for page in index.html 404.html en/index.html ru/index.html sitemap.xml robots.txt; do
	[ -s "build/$page" ] || fail "the build has no $page"
done

REL="$RELEASES/$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
mkdir -p "$REL"
cp -a build/. "$REL/"

PREV=$(readlink -f "$ROOT/current" 2>/dev/null || true)
ln -sfn "$REL" "$ROOT/current.tmp"
mv -Tf "$ROOT/current.tmp" "$ROOT/current" # atomic swap
log "current -> $(basename "$REL")"

healthy() {
	local path
	for path in / /en/ /ru/ /sitemap.xml; do
		curl -fsS -m 10 -o /dev/null "$HEALTH_URL$path" || {
			log "health check failed on $path"
			return 1
		}
	done
}
if ! healthy; then
	if [ -n "$PREV" ] && [ -d "$PREV" ]; then
		ln -sfn "$PREV" "$ROOT/current.tmp"
		mv -Tf "$ROOT/current.tmp" "$ROOT/current"
		fail "rolled back to $(basename "$PREV")"
	fi
	fail "no previous release to roll back to"
fi
log "health check ok: / /en/ /ru/ /sitemap.xml"

echo "$REMOTE_SHA" >"$ROOT/.deployed_sha"
echo "$CONFIG_SUM" >"$ROOT/.deployed_config"

# Prune old releases, keeping the live one plus the most recent few for rollback.
ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
	[ "$(readlink -f "$old")" = "$(readlink -f "$ROOT/current")" ] && continue
	rm -rf "$old"
done

log "deployed $(basename "$REL") OK"
