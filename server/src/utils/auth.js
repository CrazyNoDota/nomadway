const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/database');

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    return null;
  }
}

/**
 * Store refresh token in database
 */
async function storeRefreshToken(userId, token) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Ensure only one active refresh token per user to avoid uniqueness conflicts
  await prisma.refreshToken.deleteMany({ where: { userId } });

  try {
    return await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  } catch (error) {
    // If a unique constraint still fires (rare race), retry after clearing the token value
    if (error.code === 'P2002') {
      await prisma.refreshToken.deleteMany({ where: { token } });
      return prisma.refreshToken.create({
        data: {
          userId,
          token,
          expiresAt,
        },
      });
    }
    throw error;
  }
}

/**
 * Invalidate refresh token
 */
async function invalidateRefreshToken(token) {
  return prisma.refreshToken.deleteMany({
    where: { token },
  });
}

/**
 * Invalidate all refresh tokens for a user
 */
async function invalidateAllUserTokens(userId) {
  return prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Clean up expired tokens
 */
async function cleanupExpiredTokens() {
  return prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

/**
 * Generate password reset token
 */
function generateResetToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Generate email verification token
 */
function generateVerifyToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  invalidateRefreshToken,
  invalidateAllUserTokens,
  cleanupExpiredTokens,
  generateResetToken,
  generateVerifyToken,
};
