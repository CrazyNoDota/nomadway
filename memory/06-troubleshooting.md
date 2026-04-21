# 06 — Troubleshooting

Known issues encountered during deployment and their resolutions. Each
entry: **symptom**, **cause**, **fix**.

---

## `JSON Parse error: Unexpected character: <` in the mobile app

**Symptom.** App opens, any network call fails with a red alert showing
the above message.

**Cause.** The APK has a stale `extra.apiUrl` baked in (a previous
deployment's IP). It's fetching from a host that returns HTML (404 page,
landing page, or router fallback) instead of JSON, and `JSON.parse()`
chokes on the leading `<`.

**Fix.** Rebuild the APK with the current server address in `app.json`
and redistribute it. Source-level URL edits don't help existing APKs;
the URL is compiled in. See `05-apk-build-and-distribution.md`.

---

## `ERR_SSL_PROTOCOL_ERROR` when visiting `https://2.134.15.37`

**Symptom.** Browser shows "This site can't provide a secure connection /
sent an invalid response".

**Cause.** Caddy has valid Let's Encrypt certificates only for
`nomadsway.kz` and `www.nomadsway.kz`. A TLS handshake to the raw IP has
no matching certificate. Let's Encrypt does not issue certs for bare IPs.

**Fix.** Don't browse to the IP over HTTPS. Use:
- `https://nomadsway.kz/` for the site
- `http://2.134.15.37:3001` for the direct backend (HTTP only)

---

## `Entity not authorized: AppEntity[...]` from EAS

**Symptom.** `eas build` or `eas init` prints
`You don't have the required permissions to perform this operation`.

**Cause.** The `projectId` in `app.json` belongs to an EAS account
other than the one you're logged into.

**Fix.** Either `eas login` with the owning account, or claim a new
projectId under the current account:

```bash
# Remove extra.eas.projectId from app.json, then:
eas init --non-interactive --force
```

`eas init --force` will create the project if the slug is free.

---

## `git pull` aborts: "local changes/untracked files would be overwritten"

**Symptom.** On the server:
```
error: The following untracked working tree files would be overwritten by merge:
    caddy/Caddyfile
Please move or remove them before you merge.
Aborting
```

**Cause.** Files were created directly on the server (before being
committed to the repo) and now collide with incoming tracked files.

**Fix.**
```bash
cd /opt/nomadway

# Untracked collisions — delete local copy
rm caddy/Caddyfile

# Tracked collisions — discard local edits (safe only if server and repo
# now agree; check with `git diff <file>` first)
git checkout -- docker-compose.yml

git pull
```

---

## Caddy cert issuance takes a while / fails

**Symptom.** `docker logs nomadway-caddy` shows repeated ACME retry lines.

**Common causes.**
- DNS A-records not yet propagated. Verify with
  `dig +short nomadsway.kz @8.8.8.8`.
- Port 80 or 443 blocked by upstream firewall / ISP.
- Previous certbot/nginx holding 80/443 — run `ss -tlnp | grep -E ':(80|443)'`.

**Fix.** Let DNS settle, ensure no other process is on 80/443, then
restart caddy: `docker compose up -d --force-recreate caddy`.

---

## Backend returns 502 / empty response after a compose rebuild

**Symptom.** `curl https://nomadsway.kz/api/...` hangs or 502s right
after `docker compose up -d --build`.

**Cause.** Prisma migrations haven't finished on startup. The backend
command is `sh -c "npx prisma migrate deploy && node src/index.js"` —
it blocks until migrations complete.

**Fix.** Wait 5-15 seconds, then check
`docker compose logs --tail=30 backend`. Look for
`✅ Database connected successfully` before testing.

---

## Docker Compose warns `version` attribute is obsolete

**Symptom.** Every `docker compose` command prints
`the attribute 'version' is obsolete, it will be ignored`.

**Cause.** `docker-compose.yml` starts with `version: '3.8'`, which
modern Compose V2 ignores.

**Fix (cosmetic).** Delete the `version:` line. Not urgent — it's a
warning, not an error.

---

## Password auth keeps failing when seeding SSH key

**Symptom.** `cat ~/.ssh/*.pub | ssh root@IP "..."` prints
`Permission denied, please try again.` repeatedly.

**Typical culprits.**
- Leading/trailing non-alphanumerics in the password being trimmed by
  a copy-paste tool. For NomadWay's VPS, the original password starts
  with `@` and ends with `:` — both easy to lose.
- Using the wrong password (hosting provider rotated it).

**Fix.** Paste character-by-character rather than typing. If still
rejected, confirm the password with the hosting provider.
