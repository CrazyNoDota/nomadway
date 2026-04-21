# 00 — Quick Reference

## Hosts and URLs

| Thing | Value |
|---|---|
| Server IP | `2.134.15.37` |
| SSH alias (local) | `ssh nomadway-new` |
| SSH raw | `ssh -i ~/.ssh/nomadway_id root@2.134.15.37` |
| Project path on server | `/opt/nomadway` |
| Domain | `nomadsway.kz` |
| Registrar DNS (ps.kz NS) | A-records for `@` and `www` → `2.134.15.37` |
| Website | https://nomadsway.kz/ |
| Backend API (via Caddy) | https://nomadsway.kz/api/... |
| Backend direct (from APK) | http://2.134.15.37:3001 |
| Health check | https://nomadsway.kz/health |
| APK download | https://nomadsway.kz/nomadway.apk |

## Repo and builds

| Thing | Value |
|---|---|
| GitHub repo | https://github.com/CrazyNoDota/nomadway |
| Default branch | `master` |
| EAS account | `crazynodota3` (email `bucoze@ozvmail.com`) |
| EAS project | `@crazynodota3/nomadway` |
| EAS projectId | `b3591dc4-18de-435d-83c5-e5cc711c8760` |
| EAS project page | https://expo.dev/accounts/crazynodota3/projects/nomadway |

## Five commands you'll actually run

```bash
# SSH in
ssh nomadway-new

# Check what's running
cd /opt/nomadway && docker compose ps

# Tail backend logs
cd /opt/nomadway && docker compose logs -f backend

# Pull latest code and rebuild everything
cd /opt/nomadway && git pull && docker compose up -d --build

# Reload Caddy after editing caddy/Caddyfile
docker exec nomadway-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

## Ports exposed

| Port | Service | Public? |
|---|---|---|
| 80 | Caddy (redirects to 443) | yes |
| 443 | Caddy (TLS) | yes |
| 443/udp | Caddy (HTTP/3) | yes |
| 3001 | backend | yes (used by mobile app) |
| 5432 | postgres | yes (**should be firewalled — hardening TODO**) |

## Volumes (Docker)

| Volume | Purpose |
|---|---|
| `nomadway_postgres_data` | Database files — back this up |
| `nomadway_caddy_data` | Let's Encrypt certs + ACME account — don't wipe |
| `nomadway_caddy_config` | Caddy's runtime JSON config |
| `nomadway_apks` | Legacy APK volume (backend also has `/app/public/apk`) |
