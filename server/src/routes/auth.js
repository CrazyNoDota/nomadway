const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  invalidateRefreshToken,
  invalidateAllUserTokens,
  generateResetToken,
  generateVerifyToken,
} = require('../utils/auth');
const { authenticate } = require('../middleware/auth');
const { validate, registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } = require('../middleware/validation');
const { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } = require('../services/emailService');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, fullName, displayName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email already exists',
        },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const verifyToken = generateVerifyToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        displayName: displayName || fullName?.split(' ')[0] || email.split('@')[0],
        verifyToken,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || email)}&background=FF6B35&color=fff`,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
        points: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user);
    sendVerificationEmail(user, verifyToken);

    res.status(201).json({
      message: 'Registration successful',
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to create account',
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      return res.status(401).json({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'This account has been disabled',
        },
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        points: user.points,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'LOGIN_FAILED',
        message: 'Login failed',
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', validate(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token has expired',
        },
      });
    }

    const user = storedToken.user;

    if (!user.isActive || user.isDeleted) {
      return res.status(401).json({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'This account has been disabled',
        },
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Invalidate old refresh token and store new one
    await invalidateRefreshToken(refreshToken);
    await storeRefreshToken(user.id, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: {
        code: 'REFRESH_FAILED',
        message: 'Failed to refresh token',
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await invalidateRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Failed to logout',
      },
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    await invalidateAllUserTokens(req.user.id);

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Failed to logout from all devices',
      },
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, you will receive a password reset link',
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(user, resetToken);

    res.json({
      message: 'If an account exists with this email, you will receive a password reset link',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: {
        code: 'REQUEST_FAILED',
        message: 'Failed to process request',
      },
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
        },
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    // Invalidate all refresh tokens
    await invalidateAllUserTokens(user.id);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: {
        code: 'RESET_FAILED',
        message: 'Failed to reset password',
      },
    });
  }
});

/**
 * GET /api/auth/verify-email
 * Verify email with token
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Verification token is required',
        },
      });
    }

    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid verification token',
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
      },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: {
        code: 'VERIFICATION_FAILED',
        message: 'Failed to verify email',
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        points: true,
        locationCity: true,
        locationCountryCode: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            achievements: true,
            favorites: true,
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch user data',
      },
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, validate(updateProfileSchema), async (req, res) => {
  try {
    const { fullName, displayName, bio, locationCity, locationCountryCode } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        displayName,
        bio,
        locationCity,
        locationCountryCode,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        points: true,
        locationCity: true,
        locationCountryCode: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update profile',
      },
    });
  }
});

module.exports = router;
