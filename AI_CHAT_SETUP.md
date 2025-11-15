# AI Chat Setup Guide

This guide explains how to set up the OpenAI-powered AI Chat feature for NomadWay.

## Prerequisites

1. **OpenAI API Key**: You need a paid OpenAI API key with access to GPT-4 or GPT-4o-mini
2. **Node.js**: Version 16 or higher
3. **Backend Server**: The backend server must be running for the AI chat to work

## Backend Server Setup

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
MAX_TOKENS=512
PORT=3001
```

### 3. Start the Backend Server

**Development mode (with auto-reload):**
```bash
cd server
npm run dev
```

**Production mode:**
```bash
cd server
npm start
```

The server will run on `http://localhost:3001` by default.

## Frontend Configuration

### 1. Configure API URL

The frontend needs to know where the backend server is running. Update `utils/aiGuide.js`:

**For iOS Simulator:**
```javascript
const API_BASE_URL = 'http://localhost:3001';
```

**For Android Emulator:**
```javascript
const API_BASE_URL = 'http://10.0.2.2:3001';
```

**For Physical Device:**
```javascript
// Replace YOUR_COMPUTER_IP with your computer's local IP address
const API_BASE_URL = 'http://192.168.1.100:3001';
```

**Using Environment Variables (Recommended):**

Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Then the code will automatically use this value.

### 2. Finding Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your network adapter.

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" under your network interface (usually `en0` or `eth0`).

## Testing the Setup

### 1. Test Backend Server

Open your browser and navigate to:
```
http://localhost:3001/health
```

You should see:
```json
{
  "status": "ok",
  "service": "NomadWay AI Chat API"
}
```

### 2. Test API Endpoint

You can test the chat endpoint using curl:

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What to see in Almaty in 2 days?",
    "stream": false
  }'
```

### 3. Test in the App

1. Start the Expo app:
```bash
npm start
```

2. Navigate to the AI Guide screen
3. Ask a question like "What to see in Almaty in 2 days?"
4. You should receive a response from the AI

## Troubleshooting

### Backend Server Not Responding

1. **Check if server is running:**
   ```bash
   # Check if port 3001 is in use
   netstat -an | grep 3001
   ```

2. **Check server logs:**
   Look for error messages in the server console

3. **Verify OpenAI API Key:**
   Make sure your API key is valid and has credits

### Frontend Can't Connect to Backend

1. **Check API URL:**
   - For iOS Simulator: Use `localhost:3001`
   - For Android Emulator: Use `10.0.2.2:3001`
   - For Physical Device: Use your computer's IP address

2. **Check Firewall:**
   Make sure your firewall allows connections on port 3001

3. **Check Network:**
   Ensure your device and computer are on the same network

### API Errors

1. **Invalid API Key:**
   - Verify your OpenAI API key is correct
   - Check if you have sufficient credits

2. **Rate Limits:**
   - OpenAI has rate limits based on your plan
   - Wait a moment and try again

3. **Model Not Available:**
   - Make sure you have access to the model you specified
   - Try using `gpt-4o-mini` which is more widely available

## Features

### Streaming Responses

The AI chat supports streaming responses for better UX. The response appears word-by-word as it's generated.

### Conversation History

The chat maintains conversation history (last 10 messages) to provide context-aware responses.

### Fallback Mode

If the backend server is unavailable, the app will use fallback mock responses so the feature still works for testing.

## Cost Control

### Token Limits

The default `MAX_TOKENS` is set to 512 to control costs. You can adjust this in the `.env` file:

```env
MAX_TOKENS=512
```

### Model Selection

- **gpt-4o-mini**: Cheaper, faster, good for most use cases (recommended)
- **gpt-4**: More expensive, better quality, slower

### Monitoring Usage

Monitor your OpenAI usage at: https://platform.openai.com/usage

## Production Deployment

For production, you'll need to:

1. Deploy the backend server to a hosting service (Heroku, Railway, Render, etc.)
2. Update the `API_BASE_URL` in the frontend to point to your production server
3. Set up environment variables on your hosting platform
4. Enable HTTPS for security

## Security Notes

- **Never commit your `.env` file** to version control
- **Keep your API key secret** - don't share it publicly
- **Use environment variables** for sensitive data
- **Enable rate limiting** in production to prevent abuse
- **Use HTTPS** in production to encrypt API calls

## Support

If you encounter issues:

1. Check the server logs for error messages
2. Verify your OpenAI API key is valid
3. Ensure the backend server is running and accessible
4. Check network connectivity between frontend and backend

---

Happy coding! 🚀

