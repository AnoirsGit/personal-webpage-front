# personal-webpage-front on the box

The static site (github.com/AnoirsGit/personal-webpage-front), prerendered by the repo's own adapter-static build and served by Caddy. Everything here is installed from the repo by `ops/box/install.sh` (run as root from a checkout of main); change the files in `ops/box/` and rerun it, do not edit them on the box.

| Path                                              | What                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/srv/www/personal-webpage/repo`                  | checkout of `origin/main`, the build workspace (reset by every deploy)                                               |
| `/srv/www/personal-webpage/releases/<time>-<sha>` | one built site per deploy; the last 5 are kept for rollback                                                          |
| `/srv/www/personal-webpage/current`               | symlink to the live release: Caddy's docroot                                                                         |
| `/opt/personal-webpage/deploy.sh`                 | fetch, apply the saved place, install, build, swap, health check, roll back on failure                               |
| `/var/log/personal-webpage-deploy.log`            | deploy log with the build output (logrotate: monthly, 6 kept); last build also in `/tmp/personal-webpage-build.log`  |
| `/etc/caddy/Caddyfile`                            | the site, `www` → bare domain, real 404s, a year of cache for `/_app/immutable/*`                                    |
| `site-admin.service`                              | the place admin on `127.0.0.1:8792` (user `site-admin`, sandboxed), code in `/usr/local/lib/site-admin`              |
| `/etc/site-admin/env`                             | its token and allowed Host names: loopback, the box's tailnet name and address (`root:site-admin`, 0640; not in git) |
| `/var/lib/site-admin/site-config.json`            | the place it saved; each deploy applies it over `src/lib/config/site-config.json`                                    |
| `/var/lib/site-admin/rebuild-request`             | rewritten by «Пересобрать ещё раз»                                                                                   |
| `site-rebuild.path`                               | watches those two files and starts `site-rebuild.service` (root)                                                     |
| `/opt/personal-webpage/site-rebuild.sh`           | what the service runs: `deploy.sh --force --wait`, again while saves keep coming                                     |
| `/var/lib/site-rebuild/`                          | `status.json` and `rebuild.log` of the last rebuild (root, 0644), read by the admin                                  |

## Deploys

- Root's cron runs `deploy.sh` daily at 04:30 UTC; it rebuilds only when `origin/main` or the saved place changed.
- A save in the admin: `site-rebuild.path` → `site-rebuild.service` → `site-rebuild.sh` → `deploy.sh --force --wait`. A save during that build makes the script build once more (systemd itself drops a trigger while the service runs). Logs: `/var/lib/site-rebuild/rebuild.log`, `journalctl -u site-rebuild`.
- By hand: `/opt/personal-webpage/deploy.sh` (`--force` rebuilds the same commit). One deploy at a time (`flock` on `/var/lock/personal-webpage-deploy.lock`).
- A failed build or health check leaves the previous release serving. Manual rollback: `ln -sfn /srv/www/personal-webpage/releases/<older> /srv/www/personal-webpage/current.tmp && mv -Tf /srv/www/personal-webpage/current.tmp /srv/www/personal-webpage/current`.

## The place admin

From the owner's devices on the tailnet: `http://<tailnet name>:8792/?token=<SITE_ADMIN_TOKEN>` once (`cat /etc/site-admin/env`); the box's userspace tailscaled forwards tailnet connections to loopback, so the admin needs no other listener. Or `ssh -L 8792:127.0.0.1:8792 root@<box>` and `http://127.0.0.1:8792/?token=…`. The browser keeps a session cookie for 30 days. The admin has no rights beyond its state directory: no sudo (an earlier `/etc/sudoers.d/site-admin` is removed by `install.sh`). Logs: `journalctl -u site-admin`. A new token: edit the env file, `systemctl restart site-admin`.

## Notes

- `caddy validate` run as root creates root-owned log files that the `caddy` user then cannot open; `install.sh` validates as `caddy`. If the service fails to start: `chown -R caddy:caddy /var/log/caddy`.
- From the old setup and unused now: `/opt/personal-webpage/svelte.config.js` (the adapter overlay), `Caddyfile.https`, `enable-https.sh`, `deploy.sh.bak-*`.
- Apache2 held :80 once (stock Ubuntu page); it was stopped and disabled on 2026-07-25.
