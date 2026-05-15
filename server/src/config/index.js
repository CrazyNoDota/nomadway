// Server configuration
require('dotenv').config();

module.exports = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:19000',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Google OAuth (Sign-In with Google)
  google: {
    // Accept any of: web, android, iOS client IDs. The Google ID token's `aud`
    // claim will match exactly one of them depending on which client signed in.
    audiences: [
      process.env.GOOGLE_CLIENT_ID_WEB,
      process.env.GOOGLE_CLIENT_ID_ANDROID,
      process.env.GOOGLE_CLIENT_ID_IOS,
      process.env.GOOGLE_CLIENT_ID, // legacy single var
    ].filter(Boolean),
  },

  // OpenAI (legacy fallback)
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.MAX_TOKENS || '512'),
  },

  // NVIDIA AI (primary chat + embeddings)
  nvidia: {
    baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    llmApiKey: process.env.NVIDIA_LLM_API_KEY,
    embedApiKey: process.env.NVIDIA_EMBED_API_KEY,
    llmModel: process.env.NVIDIA_LLM_MODEL || 'minimaxai/minimax-m2.7',
    embedModel: process.env.NVIDIA_EMBED_MODEL || 'nvidia/llama-3.2-nv-embedqa-1b-v2',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1024', 10),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  },
  
  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'NomadWay <noreply@nomadway.kz>',
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // Gamification Points
  points: {
    visitPlace: 20,
    checkIn: 10,
    createPost: 15,
    receiveComment: 5,
    receiveLike: 2,
    completeRoute: 50,
  },
};
