# Deployment & Operations Notes

This folder documents the deployment of NomadWay to the production server.
Claude (Opus 4.7) performed this deployment on 2026-04-21. Files here are
human-readable notes, not code.

## Index

- [01-deployment.md](01-deployment.md) — Initial server provisioning and Docker Compose deployment
- [02-ssl-and-reverse-proxy.md](02-ssl-and-reverse-proxy.md) — Caddy reverse proxy with Let's Encrypt SSL
- [03-app-api-url-fix.md](03-app-api-url-fix.md) — Fixing the mobile app JSON parse error (stale API URL)
- [04-server-access.md](04-server-access.md) — How to SSH into and operate the server

## TL;DR

- **Server:** `root@2.134.15.37` (Ubuntu, Docker 29.4.1 + Compose v5.1.3)
- **Domain:** `nomadsway.kz` (A-records for `@` and `www` → `2.134.15.37`)
- **SSH shortcut:** `ssh nomadway-new` (key: `~/.ssh/nomadway_id`)
- **Project path on server:** `/opt/nomadway`
- **Public endpoints:**
  - `https://nomadsway.kz/` — website
  - `https://nomadsway.kz/api/...` — backend API (proxied through Caddy)
  - `https://nomadsway.kz/health` — backend health check
