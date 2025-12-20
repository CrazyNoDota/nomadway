# Placeholder for APK file

This folder is used to store APK files for local development.

## For local testing:
1. Place your APK file here as `nomadway-latest.apk`
2. The website download button will serve this file via the Vite proxy

## File naming convention:
- `nomadway-latest.apk` - Always the latest version (used by download button)
- `nomadway-v1.0.0.apk` - Version-specific file (optional)

## Note:
This folder is for **development only**. On the VPS, APK files should be 
stored in `/var/www/nomadway-files/apk/` for production.
