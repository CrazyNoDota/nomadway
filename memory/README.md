# NomadWay Operations Memory

Every file in this folder is **self-contained** — read only the one you need.
Start with `00-quick-reference.md` when you just need a URL, IP, or one-liner.

Files are numbered so they stay in order when listed. The numbers are
chapters, not dependencies.

## Index

| #  | File | When to open it |
|----|------|-----------------|
| 00 | [quick-reference.md](00-quick-reference.md) | IPs, domains, URLs, IDs, SSH alias, the 5 commands you'll actually run |
| 01 | [deployment.md](01-deployment.md) | Provisioning the server from scratch (Docker install, first compose up) |
| 02 | [ssl-and-reverse-proxy.md](02-ssl-and-reverse-proxy.md) | How Caddy + Let's Encrypt is wired and how to add a new domain/path |
| 03 | [app-api-url-fix.md](03-app-api-url-fix.md) | Story of the "JSON Parse error: `<`" symptom and why APK URLs are baked in |
| 04 | [server-access.md](04-server-access.md) | Day-two ops: logs, restarts, DB, hardening TODO |
| 05 | [apk-build-and-distribution.md](05-apk-build-and-distribution.md) | EAS setup, building new APKs, how the download flow works |
| 06 | [troubleshooting.md](06-troubleshooting.md) | Known errors and their resolutions (SSL by IP, git pull conflicts, etc.) |
| 07 | [project-structure.md](07-project-structure.md) | What lives where in the repo |
| 08 | [accounts-and-credentials.md](08-accounts-and-credentials.md) | Who owns what (EAS, GitHub, registrar) — no secrets, just pointers |

## One-paragraph TL;DR

NomadWay runs on a single Ubuntu VPS at `2.134.15.37` under the domain
**nomadsway.kz**. The stack is **Docker Compose** with four services:
`postgres`, `backend` (Node/Express/Prisma/Socket.io), `website`
(Vite + React behind nginx), and `caddy` (reverse proxy + Let's Encrypt).
Caddy terminates TLS on 80/443 and routes `/api/*`, `/socket.io/*`, and
`/health` to the backend; everything else goes to the website. A
preview APK of the React Native app is baked into the website's static
files at `/nomadway.apk` and hits the backend directly on
`http://2.134.15.37:3001`. All infra lives in `/opt/nomadway` on the
server; the repo is `github.com/CrazyNoDota/nomadway`. SSH in with
`ssh nomadway-new`.
