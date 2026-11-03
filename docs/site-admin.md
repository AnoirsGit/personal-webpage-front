# Админка места

The place admin (`tools/site-admin/`) is where the owner says which country he is in: a searchable list of the 177 countries the globe knows, then «другая страна» — the other 75 of ISO 3166-1 (Singapore, Malta, Hong Kong…), Russian and English names, codes; the city in English and Russian; coordinates (for a globe country prefilled with a point inside it, for another one typed in; rounded to 0.01° — a city, not an address) and an IANA time zone. It shows the JSON it will write and saves it; the site rebuilds by itself and the page shows the build log live. Node ≥ 20, no dependencies.

- **Open it.** On the box it is `site-admin.service` on `127.0.0.1:8792`. From the owner's devices on the tailnet: `http://<box tailnet name>:8792/?token=<SITE_ADMIN_TOKEN>` once (the box's userspace tailscaled hands tailnet connections to loopback; `install.sh` prints the exact address). Otherwise `ssh -L 8792:127.0.0.1:8792 root@<box>` and `http://127.0.0.1:8792/?token=…`. The token is in `/etc/site-admin/env`; the browser then keeps an HttpOnly, SameSite=Strict session cookie for 30 days. Only the Host names listed in that env file are answered, and every write needs a same-origin `Origin`.
- **What a save changes.** Everything that reads `src/lib/config/site-config.json` at build time, in both languages: the globe's highlighted country (none for «другая страна»), home marker and arcs, `{city}`, `{country}` and the UTC offset in the copy and meta tags, and the JSON-LD address and coordinates. A failed build leaves the previous release online. Nothing rendered offline goes stale: the OG images and the no-WebGL posters carry no location ([architecture](architecture.md)).
- **How the rebuild starts.** The admin runs nothing and has no rights: it only writes the config atomically. A root path unit (`site-rebuild.path`) sees the file change and starts `site-rebuild.service`, which runs `deploy.sh --force --wait` — again if another save arrived during the build — and writes `status.json` and `rebuild.log` to `/var/lib/site-rebuild` for the page. «Пересобрать ещё раз» rewrites a request file next to the config, which the path unit watches too.
- **Where the config lives.** `/var/lib/site-admin/site-config.json` on the box (`SITE_CONFIG_PATH`; outside git and the build). Before each build `deploy.sh` checks it with `tools/site-admin/apply-config.js` and puts its `home` over `src/lib/config/site-config.json`. The file in git stays the default for local builds, and the admin shows it until the first save.

The box side (units, paths, logs, a new token) is in [`ops/box/README.md`](../ops/box/README.md).

## Settings

All from the environment (`tools/site-admin/lib/settings.js`; on the box `/etc/site-admin/env`, written by `install.sh`). A bad value stops the server with exit code 2 and a list of what is wrong.

| Variable                    | Default                                                | What                                                                                    |
| --------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `SITE_ADMIN_TOKEN`          | — (required)                                           | 16+ characters, no whitespace; `?token=` exchanges it for the session cookie            |
| `SITE_CONFIG_PATH`          | — (required)                                           | the file a save writes; absolute, outside any git work tree                             |
| `SITE_REBUILD_STATUS_DIR`   | unset: save only, no build log                         | where the rebuild writes `status.json` and `rebuild.log` (box: `/var/lib/site-rebuild`) |
| `SITE_REBUILD_REQUEST_PATH` | `rebuild-request` next to `SITE_CONFIG_PATH`           | the file «Пересобрать ещё раз» rewrites                                                 |
| `SITE_ADMIN_BIND`           | `127.0.0.1`                                            | listen address                                                                          |
| `SITE_ADMIN_PORT`           | `8792`                                                 | listen port                                                                             |
| `SITE_ADMIN_ALLOWED_HOSTS`  | `127.0.0.1:<port>,localhost:<port>`                    | comma-separated Host header values that are answered                                    |
| `SITE_ADMIN_COUNTRIES`      | the repo's `src/lib/ne_110m_admin_0_countries.geojson` | the globe's countries                                                                   |
| `SITE_ADMIN_DEFAULT_CONFIG` | the repo's `src/lib/config/site-config.json`           | shown until the first save                                                              |

## Locally

With stand-ins for the path unit and the deploy (two terminals):

```bash
node tools/site-admin/test/fixtures/fake-path-unit.js /tmp/site-admin/site-config.json /tmp/site-admin/rebuild
SITE_ADMIN_TOKEN=local-token-0123456789 SITE_CONFIG_PATH=/tmp/site-admin/site-config.json \
  SITE_REBUILD_STATUS_DIR=/tmp/site-admin/rebuild node tools/site-admin/server.js
# then open http://127.0.0.1:8792/?token=local-token-0123456789
```

Tests: `node --test --test-concurrency=2 'tools/site-admin/test/*.test.js'` (39 tests; all passed on Linux on 2026-10-21). They need Linux tools: the five in `site-rebuild.test.js` run `ops/box/site-rebuild.sh`, which uses `flock`, GNU `date` (`%3N`, `-Is`) and `stat -c`, so on macOS they fail by timeout (34 of 39 pass, checked 2026-11-05) unless those tools are installed.
