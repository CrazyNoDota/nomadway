# 04 — Server Access & Operations

## Connect

```bash
ssh nomadway-new            # uses the alias in ~/.ssh/config
# equivalent to:
ssh -i ~/.ssh/nomadway_id root@2.134.15.37
```

Project lives at `/opt/nomadway`.

## Everyday operations

From inside `/opt/nomadway`:

```bash
# Status
docker compose ps

# Logs
docker compose logs -f               # all services
docker compose logs -f backend       # one service

# Restart one service (picks up .env changes)
docker compose up -d --force-recreate backend

# Rebuild after git pull
git pull
docker compose up -d --build

# Reload Caddy only (after editing caddy/Caddyfile)
docker exec nomadway-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

## Environment variables

Stored in `/opt/nomadway/.env` (mode 0600, root-owned, **not in git**).
If the server is rebuilt you'll need to recreate it — see
`01-deployment.md` for the list of required keys.

`.env.bak.<timestamp>` files are left behind whenever the file is
edited — keep or prune at will.

## Database

```bash
# Open psql
docker compose exec postgres psql -U nomadway -d nomadway

# Run Prisma migrations after a schema change
docker compose exec backend npx prisma migrate deploy

# Launch Prisma Studio on port 5555 (kill with Ctrl-C)
docker compose --profile tools run --rm -p 5555:5555 prisma-studio
```

Data lives in the `postgres_data` Docker volume. Back it up periodically
with `docker run --rm -v nomadway_postgres_data:/data -v $PWD:/b alpine tar czf /b/pg-$(date +%F).tar.gz -C /data .`.

## Hardening TODO

These are not yet done — apply when you are ready:

1. **Firewall:** `ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw enable`.
   Then remove the public port mappings for `3001` and `5432` in
   `docker-compose.yml` (change `"3001:3001"` to `"127.0.0.1:3001:3001"`
   or drop the mapping entirely, since Caddy proxies `/api`).
2. **Disable SSH password auth:** edit `/etc/ssh/sshd_config`, set
   `PasswordAuthentication no`, then `systemctl reload ssh`.
   Confirm `ssh nomadway-new` still works first.
3. **Automated Postgres backups** — add a small cron job or a sidecar
   container that dumps the DB daily to a volume/offsite location.
4. **Log rotation** — Docker's default `json-file` driver can grow
   unbounded; consider setting `log-opts` in `/etc/docker/daemon.json`.
