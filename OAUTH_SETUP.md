# Google Sign-In Setup

The code is wired but the OAuth flow won't work until you create OAuth client IDs in Google Cloud Console and plug them in.

## 1. Create OAuth client IDs (Google Cloud Console)

Go to https://console.cloud.google.com/apis/credentials, then **Create Credentials → OAuth client ID**.

You need (at least) two clients:

### Web client
- Application type: **Web application**
- Authorized redirect URIs (none needed for native flow, but Expo Go uses a proxy — leave blank for production builds)
- Used for: ID-token verification on the backend AND as `webClientId` in the app for the Expo Go workflow / Android.

### Android client
- Application type: **Android**
- Package name: `com.nomadway.app` (matches `android.package` in `app.json`)
- SHA-1 certificate fingerprint: get it from EAS:
  ```bash
  eas credentials
  ```
  Pick your Android profile → keystore → copy the SHA1.

### (Optional) iOS client
- Application type: **iOS**
- Bundle ID: `com.nomadway.app`

## 2. Plug client IDs into the app

Edit `app.json` → `expo.extra`:
```json
"googleClientIdWeb":     "XXXXXX.apps.googleusercontent.com",
"googleClientIdAndroid": "XXXXXX.apps.googleusercontent.com",
"googleClientIdIos":     "XXXXXX.apps.googleusercontent.com",
```
For local development without EAS, only the **Web** client ID is required (Expo proxies the redirect).

## 3. Plug client IDs into the backend

In `server/.env` (and your VPS environment):
```
GOOGLE_CLIENT_ID_WEB=XXXXXX.apps.googleusercontent.com
GOOGLE_CLIENT_ID_ANDROID=XXXXXX.apps.googleusercontent.com
GOOGLE_CLIENT_ID_IOS=XXXXXX.apps.googleusercontent.com
```
The backend accepts any of these as a valid `aud` claim on the ID token, so you can list all three on the same backend.

## 4. Run the database migration

The OAuth schema migration adds `auth_provider`, `google_id` columns and makes `password_hash` nullable. Apply it:
```bash
cd server
npx prisma migrate deploy
```
This is safe to re-run; existing email/password users keep `auth_provider='email'` and a populated `password_hash`.

## 5. Verify

- `POST /api/auth/google` with `{ "idToken": "..." }` should return tokens.
- Without `GOOGLE_CLIENT_ID_*` set, the endpoint returns `OAUTH_NOT_CONFIGURED`.
- In the app, tapping the Google button before client IDs are configured shows a "Coming soon" alert (no crash).

## How account linking works

- If a Google account's email matches an existing email/password user, the records are **linked**: the existing row gets `google_id` set, and the user can sign in either way.
- A pure Google signup creates a row with `auth_provider='google'` and `password_hash=NULL`. They cannot use `/api/auth/login` until they set a password via `/api/auth/forgot-password`.
