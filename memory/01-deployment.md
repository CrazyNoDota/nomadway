# 01 — Initial Deployment

Date: 2026-04-21
Target: `root@2.134.15.37` (Ubuntu 24.04, 30G disk)

## 1. SSH key setup

Reused the existing local key `~/.ssh/nomadway_id` (ed25519). Added a host
alias to `~/.ssh/config` on the developer machine:

```
Host nomadway-new
  HostName 2.134.15.37
  User root
  IdentityFile ~/.ssh/nomadway_id
  IdentitiesOnly yes
```

Public key was copied to the server with:

```bash
cat ~/.ssh/nomadway_id.pub | ssh root@2.134.15.37 \
  "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys \
   && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

(Password auth was used once for this step; see hardening recommendations in
`04-server-access.md`.)

## 2. Docker install

Installed via the official convenience script:

```bash
curl -fsSL https://get.docker.com | sh
```

Resulting versions:

- Docker `29.4.1`
- Docker Compose `v5.1.3`

## 3. Clone & configure

```bash
cd /opt
git clone https://github.com/CrazyNoDota/nomadway.git
cd nomadway
```

Created `/opt/nomadway/.env` with **randomly generated** secrets
(the actual values are only on the server — never commit them):

- `POSTGRES_PASSWORD` — 32 hex chars
- `JWT_SECRET` — 96 hex chars
- `JWT_REFRESH_SECRET` — 96 hex chars
- `OPENAI_API_KEY` — provided by user
- `FRONTEND_URL=https://nomadsway.kz`
- SMTP and Cloudinary left blank (optional, fill in when needed)

File perms locked to `chmod 600 .env`.

## 4. First launch

```bash
docker compose up -d --build
```

Services started:

| Service  | Container            | Port          |
|----------|----------------------|---------------|
| postgres | nomadway-postgres    | 5432 (public) |
| backend  | nomadway-backend     | 3001 (public) |
| website  | nomadway-website     | 80 (later moved behind Caddy) |

Prisma migrations applied on first boot
(`20251219112945_add_app_events`). Backend `/health` returned 200.

## Rollback

If deployment needs to be torn down:

```bash
ssh nomadway-new
cd /opt/nomadway
docker compose down
# to also wipe the database volume:
docker compose down -v
```
