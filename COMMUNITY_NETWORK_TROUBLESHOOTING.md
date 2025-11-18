# Community Module Network Troubleshooting

## Problem: "Network request failed" Error

If you're seeing "Network request failed" errors in the Community module, follow these steps:

## 1. Check if Backend Server is Running

First, make sure the backend server is running:

```bash
cd server
npm start
```

You should see:
```
🚀 NomadWay AI Chat API server running on port 3001
📍 Health check: http://localhost:3001/health
```

Test the server by opening in your browser:
- http://localhost:3001/health

You should see: `{"status":"ok","service":"NomadWay AI Chat API"}`

## 2. Configure API URL for Your Platform

The Community API automatically detects your platform, but you may need to configure it manually:

### Option A: Using Environment Variable (Recommended)

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Then restart your Expo app.

### Option B: Manual Configuration

Edit `utils/communityApi.js` and update the `getApiBaseUrl()` function:

**For iOS Simulator:**
```javascript
return 'http://localhost:3001/api/v1';
```

**For Android Emulator:**
```javascript
return 'http://10.0.2.2:3001/api/v1';
```

**For Physical Device:**
```javascript
// Replace with your computer's IP address
return 'http://192.168.1.100:3001/api/v1';
```

## 3. Find Your Computer's IP Address

If you're testing on a physical device, you need your computer's local IP address:

### Windows:
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

### Mac/Linux:
```bash
ifconfig
```
Look for "inet" under your network interface (usually `en0` for Wi-Fi or `eth0` for Ethernet)

### Example:
If your IP is `192.168.1.100`, update the API URL to:
```javascript
return 'http://192.168.1.100:3001/api/v1';
```

## 4. Check Firewall Settings

Make sure your firewall allows connections on port 3001:

### Windows:
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "3001"
6. Allow the connection

### Mac:
```bash
# Allow incoming connections on port 3001
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
```

## 5. Verify CORS Configuration

The backend server should already have CORS enabled. Check `server/server.js`:

```javascript
app.use(cors());
```

This should allow requests from any origin (for development).

## 6. Test the Connection

### Test 1: Health Check
Open in browser: `http://localhost:3001/health`

### Test 2: Community Feed Endpoint
Open in browser: `http://localhost:3001/api/v1/community/feed`

You should see JSON response (may be empty if no posts exist).

### Test 3: From React Native
Check the console logs. You should see:
```
Community API Base URL: http://...
Making API request to: http://.../community/feed
```

## 7. Common Issues and Solutions

### Issue: "Network request failed" on Android Emulator
**Solution:** Use `http://10.0.2.2:3001` instead of `localhost`

### Issue: "Network request failed" on Physical Device
**Solution:** 
1. Make sure your phone and computer are on the same Wi-Fi network
2. Use your computer's IP address (not localhost)
3. Check firewall settings

### Issue: "Connection refused"
**Solution:** 
1. Make sure the server is running
2. Check if port 3001 is already in use: `lsof -i :3001` (Mac/Linux) or `netstat -ano | findstr :3001` (Windows)

### Issue: "CORS error"
**Solution:** The server already has CORS enabled. If you still see CORS errors, make sure `app.use(cors())` is in `server/server.js`

## 8. Debug Mode

To see detailed API logs, check your React Native console. The Community API logs:
- The API base URL being used
- Each API request URL
- Detailed error messages for network failures

## 9. Quick Test

Run this in your React Native app console to test the connection:

```javascript
import * as CommunityApi from './utils/communityApi';

// Test the feed endpoint
CommunityApi.getFeed()
  .then(data => console.log('Success!', data))
  .catch(error => console.error('Error:', error));
```

## Still Having Issues?

1. **Check server logs** - Look at the terminal where the server is running for errors
2. **Check React Native logs** - Look for detailed error messages in the console
3. **Verify network** - Make sure your device/emulator can reach your computer
4. **Try restarting** - Restart both the server and the React Native app

## Production Deployment

For production, you'll need to:
1. Deploy the backend server to a cloud service (Heroku, AWS, etc.)
2. Update `EXPO_PUBLIC_API_URL` to your production server URL
3. Configure proper CORS settings for your domain
4. Set up HTTPS/SSL certificates

---

**Last Updated:** November 2025

