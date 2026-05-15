const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const OpenAI = require('openai');

const config = require('./config');
const { retrieveContext, formatContext, loadIndex } = require('./services/rag');
require('./config/database'); // Initialize database connection

// Import routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const favoritesRoutes = require('./routes/favorites');
const gamificationRoutes = require('./routes/gamification');
const communityRoutes = require('./routes/community');
const attractionsRoutes = require('./routes/attractions');
const routesRoutes = require('./routes/routes');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize NVIDIA-backed client (OpenAI-compatible endpoint).
// Falls back to OpenAI proper if NVIDIA_LLM_API_KEY is not set.
const useNvidia = !!config.nvidia.llmApiKey;
const llmClient = new OpenAI(
  useNvidia
    ? { apiKey: config.nvidia.llmApiKey, baseURL: config.nvidia.baseUrl }
    : { apiKey: config.openai.apiKey }
);
const LLM_MODEL = useNvidia ? config.nvidia.llmModel : config.openai.model;
const LLM_MAX_TOKENS = useNvidia ? config.nvidia.maxTokens : config.openai.maxTokens;
const LLM_TEMPERATURE = useNvidia ? config.nvidia.temperature : 0.7;

// Preload RAG index at boot (no network call; just JSON read)
loadIndex();

// ================== MIDDLEWARE ==================

// Trust proxy (required when behind Nginx/reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });
}

// ================== ROUTES ==================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NomadWay API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/community', communityRoutes); // Also support without v1
app.use('/api/attractions', attractionsRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);

// ================== APK DOWNLOAD (Development) ==================
// Serve APK files from public/apk folder for local development
// In production, Nginx will serve these from /var/www/nomadway-files/apk/
const path = require('path');
app.use('/download', express.static(path.join(__dirname, '../public/apk'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.apk')) {
      res.set('Content-Type', 'application/vnd.android.package-archive');
      res.set('Content-Disposition', 'attachment; filename="NomadWay.apk"');
    }
  }
}));

// ================== AI CHAT ENDPOINT ==================

const SYSTEM_PROMPT_BASE = `Ты — умный туристический ассистент NomadsWay, мобильного приложения о путешествиях по Казахстану.

Твоя миссия: помогать пользователям выбирать туры, составлять маршруты, объяснять региональные нюансы и решать логистику с учётом бюджета, сезона, города отправления и интересов.

Правила:
1. Тон: дружелюбный эксперт, как знающий местный. Кратко, по делу, без воды.
2. Конкретика: цены в тенге, расстояния, время. Если данных нет — честно скажи.
3. Проактивность: предлагай альтернативы, лучшее время, способы сэкономить.
4. Язык: отвечай на том же языке, на котором задан вопрос (русский / English / қазақша).
5. Маршруты: расписание утро/день/вечер по дням, транспорт между точками, смета.

Источник истины: ниже приведён КОНТЕКСТ из официальных материалов NomadsWay. Если ответ есть в контексте — используй его и ссылайся на источник в формате [Источник N]. Если в контексте нет нужной информации — опирайся на общие знания о Казахстане, но прямо предупреди пользователя, что точных данных нет.`;

function buildSystemPrompt(contextBlock) {
  if (!contextBlock) {
    return `${SYSTEM_PROMPT_BASE}\n\n(КОНТЕКСТ из базы знаний пуст для этого запроса — отвечай на основе общих знаний.)`;
  }
  return `${SYSTEM_PROMPT_BASE}\n\n=== КОНТЕКСТ ===\n${contextBlock}\n=== КОНЕЦ КОНТЕКСТА ===`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], stream = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Retrieve relevant chunks from the RAG index
    const hits = await retrieveContext(message);
    const contextBlock = formatContext(hits);
    const sources = hits.map((h) => ({ source: h.source, score: Number(h.score.toFixed(3)) }));

    const messages = [
      { role: 'system', content: buildSystemPrompt(contextBlock) },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await llmClient.chat.completions.create({
        model: LLM_MODEL,
        messages,
        max_tokens: LLM_MAX_TOKENS,
        temperature: LLM_TEMPERATURE,
        stream: true,
      });

      // Send retrieved sources first so the client can show citations
      res.write(`data: ${JSON.stringify({ sources })}\n\n`);

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const completion = await llmClient.chat.completions.create({
        model: LLM_MODEL,
        messages,
        max_tokens: LLM_MAX_TOKENS,
        temperature: LLM_TEMPERATURE,
      });

      res.json({
        response: completion.choices[0].message.content,
        sources,
        usage: completion.usage,
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: {
        code: 'CHAT_FAILED',
        message: error.message || 'Chat failed',
      },
    });
  }
});

// ================== SOCKET.IO FOR REAL-TIME ==================

// Connected users map
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User authentication via socket
  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} authenticated on socket ${socket.id}`);
  });

  // Join a community room
  socket.on('join-community', (room) => {
    socket.join(`community:${room}`);
    console.log(`Socket ${socket.id} joined community:${room}`);
  });

  // Leave a community room
  socket.on('leave-community', (room) => {
    socket.leave(`community:${room}`);
  });

  // New post notification
  socket.on('new-post', (post) => {
    socket.to('community:all').emit('post-created', post);
  });

  // New comment notification
  socket.on('new-comment', (data) => {
    socket.to(`community:post:${data.postId}`).emit('comment-added', data);
  });

  // Like notification
  socket.on('post-liked', (data) => {
    // Notify post author
    if (data.authorId && connectedUsers.has(data.authorId)) {
      io.to(connectedUsers.get(data.authorId)).emit('notification', {
        type: 'like',
        message: `${data.userName} liked your post`,
        postId: data.postId,
      });
    }
  });

  // User location update (for finding nearby travelers)
  socket.on('location-update', (data) => {
    // Broadcast to travelers in the area
    socket.to('community:travelers').emit('traveler-nearby', {
      userId: socket.userId,
      ...data,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes for emitting events
app.set('io', io);

// ================== ERROR HANDLING ==================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds limit',
      },
    });
  }

  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    },
  });
});

// ================== START SERVER ==================

httpServer.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║           🏔️  NomadWay API Server 🏔️          ║
╠═══════════════════════════════════════════════╣
║  Status:    RUNNING                           ║
║  Port:      ${config.port.toString().padEnd(36)}║
║  Env:       ${config.nodeEnv.padEnd(36)}║
║  Websocket: ENABLED                           ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = { app, io };
