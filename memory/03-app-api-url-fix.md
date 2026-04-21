# 03 — Mobile App API URL Fix

Date: 2026-04-21

> **Status: resolved.** A new APK was built and is shipped at
> `website/public/nomadway.apk` with `apiUrl=http://2.134.15.37:3001`.
> For the build/distribution mechanics see
> [05-apk-build-and-distribution.md](05-apk-build-and-distribution.md).

## Symptom

After deployment, the installed APK showed:

> **Error**
> JSON Parse error: Unexpected character: `<`

## Root cause

The APK had been built with the old server IP baked in at build time:

```
app.json → extra.apiUrl = "http://91.228.154.82"
```

The app loaded, tried to hit the old host, received HTML from whatever
lives there now (or a 404 page), and `JSON.parse()` choked on the
leading `<` of the HTML.

`extra.apiUrl` is read via `Constants.expoConfig?.extra?.apiUrl` and is
the **first** value returned by `getApiBaseUrl()` in each API helper —
so it overrides everything else in a production build.

## Fix (source-level, requires a rebuild)

Replaced the old IP everywhere in the JS source:

| File                         | Old                               | New                              |
|------------------------------|-----------------------------------|----------------------------------|
| `app.json`                   | `http://91.228.154.82`            | `https://nomadsway.kz`           |
| `contexts/AuthContext.js`    | `http://91.228.154.82/api`        | `https://nomadsway.kz/api`       |
| `utils/communityApi.js`      | `http://91.228.154.82/api/v1`     | `https://nomadsway.kz/api/v1`    |
| `utils/AnalyticsService.js`  | `http://91.228.154.82/api/analytics` | `https://nomadsway.kz/api/analytics` |
| `utils/aiGuide.js`           | `http://91.228.154.82`            | `https://nomadsway.kz`           |

These URLs work because Caddy now proxies `/api/*`, `/socket.io/*`, and
`/health` on `https://nomadsway.kz` to the `backend` container (see
`02-ssl-and-reverse-proxy.md`).

## What the user needs to do

The currently-installed APK cannot be patched — its URL is compiled in.
A **new build** is required:

```bash
# Preferred (EAS, uses eas.json)
eas build -p android --profile preview

# Or local
npx expo prebuild
npx expo run:android --variant release
```

Install the fresh APK on devices. To serve it via the backend for
download, copy it into the `nomadway_apks` Docker volume:

```bash
scp nomadway-latest.apk nomadway-new:/tmp/
ssh nomadway-new "docker cp /tmp/nomadway-latest.apk nomadway-backend:/app/public/apk/"
```

## Server-side verification (backend itself is healthy)

```bash
curl https://nomadsway.kz/health
# {"status":"ok","service":"NomadWay API","version":"2.0.0",...}

curl https://nomadsway.kz/api/v1/community/feed
# {"items":[],"next_cursor":null,"server_time":"..."}
```
