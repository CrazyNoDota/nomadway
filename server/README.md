# NomadWay Backend Server

Backend server for NomadWay AI Chat functionality using OpenAI API.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
MAX_TOKENS=512
PORT=3001
```

## Running the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### POST /api/chat
Chat endpoint for AI conversations.

**Request Body:**
```json
{
  "message": "What to see in Almaty in 2 days?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help you?" }
  ],
  "stream": false
}
```

**Response (non-streaming):**
```json
{
  "response": "For 2 days in Almaty...",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  }
}
```

**Response (streaming):**
Server-Sent Events (SSE) stream with chunks:
```
data: {"content":"For"}
data: {"content":" 2"}
data: {"content":" days"}
...
data: [DONE]
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "NomadWay AI Chat API"
}
```

## Configuration

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENAI_MODEL`: Model to use (default: `gpt-4o-mini`)
- `MAX_TOKENS`: Maximum tokens per request (default: `512`)
- `PORT`: Server port (default: `3001`)

## Notes

- The server includes CORS middleware to allow requests from the React Native app
- Streaming responses are supported for better UX
- System prompt includes NomadWay context for relevant travel advice

