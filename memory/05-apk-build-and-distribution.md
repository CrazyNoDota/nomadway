# 05 — APK Build and Distribution

## Why the APK has URLs baked in

Expo reads `extra.apiUrl` from `app.json` via `Constants.expoConfig?.extra?.apiUrl`
at **build time**. All four API helper modules
(`contexts/AuthContext.js`, `utils/communityApi.js`, `utils/AnalyticsService.js`,
`utils/aiGuide.js`) check `embeddedApiUrl` **first** and return it immediately
if set. So changing the server address after a build is shipped does nothing —
a new build is required.

## Current build

| Field | Value |
|---|---|
| Build ID | `e9609d43-3057-4709-a6b5-979ef1f29fa9` |
| Git commit | `c2b4b9b` (Maps key + MAPS_ENABLED guards on AttractionDetails/MapScreen) |
| versionCode | `3` (`appBuildVersion`) |
| Profile | `preview` (EAS `distribution: internal`, `buildType: apk`) |
| API URL in APK | `https://nomadsway.kz` (from `app.json` `extra.apiUrl`) |
| Google Maps Android key | embedded in APK via `android.config.googleMaps.apiKey` in `app.json` — restrict in Cloud Console to package `com.nomadway.app` + SHA-1 `72:90:92:D3:2D:7E:3C:87:A4:05:AA:84:1B:5C:28:78:00:C8:F7:D8` and API `Maps SDK for Android` only |
| Size | 107.18 MiB (over GitHub 100 MiB hard limit — see Git LFS note below) |
| Location in repo | `website/public/nomadway.apk` (tracked by git-lfs) |
| Public URL | https://nomadsway.kz/nomadway.apk |
| Artifact URL (expires) | https://expo.dev/artifacts/eas/uPtdJwDBrHh4JVqqPMSf44.apk |
| Build page | https://expo.dev/accounts/crazynodota3/projects/nomadway/builds/e9609d43-3057-4709-a6b5-979ef1f29fa9 |

`app.json` has `"usesCleartextTraffic": true` under `android` and in the
`expo-build-properties` plugin — historically needed for HTTP-only backend
URLs. Current APK points at `https://nomadsway.kz`, so the cleartext flags
are no longer strictly required but left in for fallback.

## How to build a new APK

From the repo root, logged in as `crazynodota3`:

```bash
# Non-interactive, returns a build URL immediately
eas build --platform android --profile preview --non-interactive --no-wait

# Poll until finished (or use the Expo dashboard)
eas build:list --limit 1
```

First-time Android builds generate a keystore in the cloud automatically;
after that it's reused. Preview builds do **not** auto-increment
`versionCode` — bump it in `app.json` manually if you want distinct versions.

## How to publish a new APK to the site

1. Wait for the build to reach `FINISHED`.
2. Download the artifact:
   `curl -L -o website/public/nomadway.apk "$(eas build:view <id> --json | jq -r .artifacts.applicationArchiveUrl)"`.
3. **APKs are now tracked by git-lfs** (`.gitattributes` line
   `website/public/*.apk filter=lfs diff=lfs merge=lfs -text`). A normal
   `git add website/public/nomadway.apk` is enough — LFS will swap in a
   pointer automatically. Verify with `git show :website/public/nomadway.apk | head -3`
   (should print the LFS `version` / `oid` / `size` header).
4. Commit + `git push origin master` — push also uploads the LFS blob
   (~100 MiB, watch for `Uploading LFS objects: ...` line).
5. On the VPS:
   ```bash
   cd /opt/nomadway
   git pull                                                    # auto-smudges LFS if installed
   cp website/public/nomadway.apk /opt/nomadway-apk/nomadway.apk   # ← see gotcha below
   docker compose up -d --build website
   ```
   **First time only** on the VPS: install git-lfs. apt is currently
   blocked by a stuck `apt-get upgrade` (debconf prompt on
   openssh-server postinst, PID 3562450 from May 11). Install the binary
   directly instead:
   ```bash
   cd /tmp
   curl -sL -o git-lfs.tgz https://github.com/git-lfs/git-lfs/releases/download/v3.5.1/git-lfs-linux-amd64-v3.5.1.tar.gz
   tar xzf git-lfs.tgz
   install -m 755 git-lfs-3.5.1/git-lfs /usr/local/bin/git-lfs
   git lfs install --system
   ```

### Gotcha: the website container does NOT bind-mount the repo path

`docker-compose.yml` declares the volume as
`${APK_HOST_PATH:-./website/public/nomadway.apk}:/usr/share/nginx/html/nomadway.apk:ro`,
but `.env` on the VPS sets `APK_HOST_PATH=/opt/nomadway-apk/nomadway.apk`.
So `git pull` updates the repo copy, but nginx keeps serving the old APK
from `/opt/nomadway-apk/` until you `cp` it across. Verify with
`docker exec nomadway-website sha256sum /usr/share/nginx/html/nomadway.apk`
vs the on-disk file — they must match.

## Download flow on the site

- Button: `website/src/pages/LandingPage.jsx` → `handleDownload()` sets
  `link.href = '/nomadway.apk'` and triggers a click.
- Static file: Vite copies `website/public/*` into `dist/` during `npm run build`.
- Served by: the `website` container (nginx) directly — the request
  passes through Caddy (HTTPS termination) but is not routed to the
  backend because `/nomadway.apk` does not match `/api/*`, `/socket.io/*`,
  or `/health` in the Caddyfile.

## Old EAS project — why it changed

The original `projectId` in `app.json`
(`219fb1fc-234c-4fd0-b171-53ce32d7555a`) belonged to a different EAS
account, so the current logged-in user (`crazynodota3`) got
`Entity not authorized`. Solution: removed the old projectId from
`app.json`, ran `eas init --non-interactive --force`, which created a
new project under `crazynodota3` and wrote the new ID
(`b3591dc4-18de-435d-83c5-e5cc711c8760`) plus `"owner": "crazynodota3"`
back into `app.json`.

## Repo-size consideration

**Done — migrated to Git LFS in commit `9a62d32` (2026-05-16).** Trigger
was the Maps-key APK growing to 107 MiB, over GitHub's 100 MiB hard
limit. `.gitattributes` tracks `website/public/*.apk`; the recipe used
was:

```bash
git lfs install
git lfs track "website/public/*.apk"
git add .gitattributes
git rm --cached website/public/nomadway.apk
git add website/public/nomadway.apk
git commit -m "migrate APK to git-lfs"
```

**Watch the LFS quota** on the `CrazyNoDota/nomadway` repo —
GitHub's free plan gives 1 GiB storage + 1 GiB/month bandwidth. Each
APK push burns ~100 MiB of both. Track usage at
https://github.com/settings/billing/summary if pushes start failing.
