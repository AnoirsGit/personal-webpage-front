#!/usr/bin/env bash
# Rebuilds the site after a save in the place admin. site-rebuild.path starts
# site-rebuild.service (root) when the admin atomically rewrites
# /var/lib/site-admin/site-config.json (a save) or /var/lib/site-admin/rebuild-request
# ("rebuild again"); the service runs this script. Installed by ops/box/install.sh as
# /opt/personal-webpage/site-rebuild.sh.
#
#   site-rebuild.sh                 deploy.sh --force --wait, repeated while new saves arrive
#   site-rebuild.sh --mark-stopped  (ExecStopPost) a run killed midway: "running" → "fail"
#
# The admin has no rights here. It only reads what this script writes into its own
# root-owned directory (0644), never into the admin's:
#   status.json  {"status":"running"|"ok"|"fail","pass":N,"startedAt":"<ISO>",
#                 "finishedAt":"<ISO>"|null,"exitCode":N|null}
#   rebuild.log  this run's deploy output
#
# A save during a build does not start the service again (systemd merges that start into
# the running one), so after each pass the script checks the watched files and builds once
# more if they changed: the last save is always the one that ends up live. One run at a
# time: systemd starts one instance, this script holds a lock, deploy.sh holds its own.
#
# SITE_REBUILD_DEPLOY, SITE_REBUILD_STATUS_DIR, SITE_CONFIG_PATH and
# SITE_REBUILD_REQUEST_PATH override the box defaults below (tests, local runs).
set -euo pipefail
umask 022

STATUS_DIR=${SITE_REBUILD_STATUS_DIR:-/var/lib/site-rebuild}
CONFIG=${SITE_CONFIG_PATH:-/var/lib/site-admin/site-config.json}
REQUEST=${SITE_REBUILD_REQUEST_PATH:-/var/lib/site-admin/rebuild-request}
DEPLOY=${SITE_REBUILD_DEPLOY:-/opt/personal-webpage/deploy.sh --force --wait}
MAX_PASSES=${SITE_REBUILD_MAX_PASSES:-5}
STATUS=$STATUS_DIR/status.json
LOG=$STATUS_DIR/rebuild.log

now() { date -u +%Y-%m-%dT%H:%M:%S.%3NZ; }
log() { echo "[$(date -Is)] $*" >>"$LOG"; }

# write_status STATUS PASS STARTED FINISHED|null EXIT|null — atomically, 0644
write_status() {
	local finished=null tmp
	[ "$4" = null ] || finished="\"$4\""
	tmp=$(mktemp "$STATUS_DIR/.status.XXXXXX")
	printf '{"status":"%s","pass":%s,"startedAt":"%s","finishedAt":%s,"exitCode":%s}\n' \
		"$1" "$2" "$3" "$finished" "$5" >"$tmp"
	chmod 644 "$tmp"
	mv -f "$tmp" "$STATUS"
}

# Identity of what the admin wrote, without reading its files: each save or request is an
# atomic replace, so at least the inode changes.
watched() { stat -c '%i:%s:%Y' -- "$CONFIG" "$REQUEST" 2>/dev/null || true; }

mkdir -p "$STATUS_DIR"

if [ "${1:-}" = --mark-stopped ]; then
	if grep -q '"status":"running"' "$STATUS" 2>/dev/null; then
		pass=$(sed -n 's/.*"pass":\([0-9]*\).*/\1/p' "$STATUS")
		started=$(sed -n 's/.*"startedAt":"\([^"]*\)".*/\1/p' "$STATUS")
		write_status fail "${pass:-1}" "${started:-$(now)}" "$(now)" null
		log "stopped before the end (${SERVICE_RESULT:-killed})"
	fi
	exit 0
fi

exec 9>"$STATUS_DIR/.lock"
if ! flock -n 9; then
	echo "a rebuild is already running; it builds again if the place changed meanwhile"
	exit 0
fi

: >"$LOG"
pass=0
while :; do
	pass=$((pass + 1))
	before=$(watched)
	started=$(now)
	write_status running "$pass" "$started" null null
	log "pass $pass: $DEPLOY"
	code=0
	bash -c "$DEPLOY" >>"$LOG" 2>&1 || code=$?
	if [ "$(watched)" != "$before" ] && [ "$pass" -lt "$MAX_PASSES" ]; then
		log "the place changed during the build: building again"
		continue
	fi
	break
done

if [ "$code" -eq 0 ]; then
	write_status ok "$pass" "$started" "$(now)" 0
else
	write_status fail "$pass" "$started" "$(now)" "$code"
	log "failed with exit code $code; the previous release stays live"
fi
exit "$code"
