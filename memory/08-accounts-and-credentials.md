# 08 — Accounts and Credentials

**No secrets are stored in this file.** It's a map of "where to look"
for every credential, not a vault.

## GitHub

- Repo: https://github.com/CrazyNoDota/nomadway
- Owner: `CrazyNoDota`
- Default branch: `master`
- Pushes happen from developer's local machine; no CI deploy keys on
  the server (server uses anonymous HTTPS clone).

## EAS / Expo

- Account: `crazynodota3`
- Account email: `bucoze@ozvmail.com`
- Project: `@crazynodota3/nomadway`
- projectId: `b3591dc4-18de-435d-83c5-e5cc711c8760` (in `app.json`)
- Dashboard: https://expo.dev/accounts/crazynodota3/projects/nomadway
- Android keystore: generated and stored by EAS cloud — not on disk locally

**Prior project that got orphaned:** there was an older project with
projectId `219fb1fc-234c-4fd0-b171-53ce32d7555a` under a different EAS
account. We could not authenticate against it, so we abandoned it.
Any APK built under that old ID will not be updatable by the current
account — users with old APKs must install the new one.

## Server (VPS)

- IP: `2.134.15.37`
- Root SSH: **key-based** via `~/.ssh/nomadway_id` (ed25519)
- Root SSH: password-based is still enabled — **hardening TODO: disable**
- Hostname on the box: `nomadsway.kz`
- OS: Ubuntu (kernel 6.8 as of deployment)

## Domain

- Registrar: **ps.kz** (nameservers `ns{1,2,3}.ps.kz`)
- Domain: `nomadsway.kz`
- DNS zone edited in registrar UI — **not** the "Name-server
  Registration" / "Регистрация Name-серверов" page (that's for glue
  records).
- A-records in place: `@` and `www` → `2.134.15.37`.

## Application secrets

All live in `/opt/nomadway/.env` on the server (file mode 600).
**Never commit this file.** Required keys:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `FRONTEND_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (optional)

To rotate a secret: edit `.env`, then
`docker compose up -d --force-recreate backend`.
Changing `JWT_SECRET` invalidates all existing user sessions.

## Third-party services currently wired

| Service | Where the key lives | Status |
|---|---|---|
| OpenAI | `.env` `OPENAI_API_KEY` | Configured |
| SMTP (email) | `.env` `SMTP_*` | Not configured (blank) |
| Cloudinary (uploads) | `.env` `CLOUDINARY_*` | Not configured (blank) |
| Let's Encrypt | stored in `caddy_data` volume | Auto-renewing |

## If you lose access

- **GitHub**: recover `CrazyNoDota` account via its registered email.
- **EAS**: recover `crazynodota3` via `bucoze@ozvmail.com`.
- **Server SSH**: reset via the VPS provider's console/rescue mode,
  then re-seed `~/.ssh/nomadway_id.pub` into `/root/.ssh/authorized_keys`.
- **Domain**: recover via ps.kz account.
