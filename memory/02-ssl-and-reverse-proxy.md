# 02 — SSL and Reverse Proxy (Caddy)

Date: 2026-04-21

## Goal

Serve the site over HTTPS on `nomadsway.kz` / `www.nomadsway.kz` with
automatically renewing Let's Encrypt certificates, and route the mobile
app's API calls through the same origin.

## DNS prerequisite

Required A-records in the registrar's DNS zone (ps.kz nameservers):

```
nomadsway.kz.       A   2.134.15.37
www.nomadsway.kz.   A   2.134.15.37
```

Note: the registrar also shows a "Регистрация Name-серверов" / "Name-server
Registration" panel — **that is NOT where A-records go**. That's for glue
records when your own server is an authoritative DNS server. Use the DNS
zone editor instead.

## What changed

1. Added a `caddy` service to `docker-compose.yml`. It owns ports 80/443
   (and 443/udp for HTTP/3). Volumes `caddy_data` and `caddy_config`
   persist the ACME account and certificates across restarts.

2. Removed the public port mapping `80:80` from the `website` service.
   The website container is now reachable only on the internal
   `nomadway-network` and is proxied by Caddy.

3. Added `caddy/Caddyfile`:

   ```
   nomadsway.kz, www.nomadsway.kz {
       encode zstd gzip

       @api path /api/* /socket.io/* /health
       reverse_proxy @api backend:3001

       reverse_proxy website:80
   }
   ```

   Paths under `/api/*`, `/socket.io/*`, and `/health` are routed to the
   backend container. Everything else is served from the website SPA.

4. Flipped `FRONTEND_URL` in `.env` from `http://2.134.15.37` to
   `https://nomadsway.kz`. (Do not change this until after the cert is
   issued, otherwise CORS will reject the HTTP origin.)

## Certificate issuance

On first boot Caddy solved the `tls-alpn-01` challenge against Let's
Encrypt for both hostnames, stored the cert in the `caddy_data` volume,
and started serving HTTPS. Renewal is fully automatic — no cron needed.

## Verification

```bash
curl -sI https://nomadsway.kz/                     # 200
curl -sI http://nomadsway.kz/                      # 308 → https
curl -s  https://nomadsway.kz/health               # {"status":"ok",...}
curl -s  https://nomadsway.kz/api/v1/community/feed # {"items":[],...}
```

## Known issues / follow-ups

- Backend port 3001 and Postgres 5432 are still open to the public.
  Recommend `ufw` rules to allow only 22/80/443 once everything is
  confirmed stable.
- If a new subdomain is ever needed (e.g. `api.nomadsway.kz`), add
  both an A-record and a new block in the Caddyfile, then
  `docker exec nomadway-caddy caddy reload --config /etc/caddy/Caddyfile`.
