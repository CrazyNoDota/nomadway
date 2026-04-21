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
| Build ID | `aac034ef-7af2-49e8-93be-86992490bd5b` |
| Profile | `preview` (EAS `distribution: internal`, `buildType: apk`) |
| API URL in APK | `http://2.134.15.37:3001` (HTTP, no TLS — hits backend direct, bypassing Caddy) |
| Size | 97.7 MiB |
| Location in repo | `website/public/nomadway.apk` |
| Public URL | https://nomadsway.kz/nomadway.apk |
| Build page | https://expo.dev/accounts/crazynodota3/projects/nomadway/builds/aac034ef-7af2-49e8-93be-86992490bd5b |

`app.json` has `"usesCleartextTraffic": true` under `android` and in the
`expo-build-properties` plugin — this is what allows Android to make the
plain-HTTP call on port 3001. If you switch the APK to an HTTPS URL you
can remove those flags.

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
2. Download the artifact from the URL shown by EAS (or `eas build:view <id> --json`).
3. Replace `website/public/nomadway.apk`.
4. Commit — `*.apk` is globally ignored, but `!website/public/nomadway.apk`
   in `.gitignore` keeps this one in git.
5. Push, SSH in, `git pull && docker compose up -d --build website`.

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

GitHub warned the 98 MiB APK exceeds their 50 MiB soft limit (but is
below the 100 MiB hard limit, so the push succeeded). If APK updates
become frequent, migrate to **Git LFS**:

```bash
git lfs install
git lfs track "website/public/*.apk"
git add .gitattributes
git rm --cached website/public/nomadway.apk
git add website/public/nomadway.apk
git commit -m "migrate APK to git-lfs"
```
