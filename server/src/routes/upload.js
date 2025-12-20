const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

/**
 * Upload to Cloudinary helper
 */
async function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'nomadway',
      resource_type: 'image',
      ...options,
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }).end(buffer);
  });
}

/**
 * POST /api/upload/avatar
 * Upload user avatar
 */
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded',
        },
      });
    }

    // Check if Cloudinary is configured
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
      // Fallback to placeholder if Cloudinary not configured
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.fullName || req.user.email)}&background=FF6B35&color=fff&size=200`;
      
      await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl },
      });

      return res.json({
        message: 'Avatar updated (Cloudinary not configured, using placeholder)',
        avatarUrl,
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'nomadway/avatars',
      public_id: `user_${req.user.id}`,
      overwrite: true,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Update user avatar URL
    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.secure_url },
    });

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: result.secure_url,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message || 'Failed to upload avatar',
      },
    });
  }
});

/**
 * DELETE /api/upload/avatar
 * Remove user avatar
 */
router.delete('/avatar', authenticate, async (req, res) => {
  try {
    // Delete from Cloudinary if configured
    if (config.cloudinary.cloudName && config.cloudinary.apiKey) {
      try {
        await cloudinary.uploader.destroy(`nomadway/avatars/user_${req.user.id}`);
      } catch (e) {
        // Ignore if image doesn't exist
      }
    }

    // Reset to placeholder
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.fullName || req.user.email)}&background=FF6B35&color=fff&size=200`;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
    });

    res.json({
      message: 'Avatar removed',
      avatarUrl,
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete avatar',
      },
    });
  }
});

/**
 * POST /api/upload/post-media
 * Upload media for a community post
 */
router.post('/post-media', authenticate, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded',
        },
      });
    }

    // Check if Cloudinary is configured
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
      return res.status(503).json({
        error: {
          code: 'NOT_CONFIGURED',
          message: 'Image upload service not configured',
        },
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'nomadway/posts',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Generate thumbnail
    const thumbUrl = cloudinary.url(result.public_id, {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });

    // Create media record
    const media = await prisma.postMedia.create({
      data: {
        originalUrl: result.secure_url,
        thumbUrl,
        width: result.width,
        height: result.height,
      },
    });

    res.json({
      message: 'Media uploaded successfully',
      media: {
        id: media.id,
        originalUrl: media.originalUrl,
        thumbUrl: media.thumbUrl,
        width: media.width,
        height: media.height,
      },
    });
  } catch (error) {
    console.error('Post media upload error:', error);
    res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message || 'Failed to upload media',
      },
    });
  }
});

/**
 * POST /api/upload/post-media/multiple
 * Upload multiple media files for a post
 */
router.post('/post-media/multiple', authenticate, upload.array('media', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_FILES',
          message: 'No files uploaded',
        },
      });
    }

    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
      return res.status(503).json({
        error: {
          code: 'NOT_CONFIGURED',
          message: 'Image upload service not configured',
        },
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'nomadway/posts',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      const thumbUrl = cloudinary.url(result.public_id, {
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      });

      return prisma.postMedia.create({
        data: {
          originalUrl: result.secure_url,
          thumbUrl,
          width: result.width,
          height: result.height,
        },
      });
    });

    const mediaItems = await Promise.all(uploadPromises);

    res.json({
      message: 'Media uploaded successfully',
      media: mediaItems.map(m => ({
        id: m.id,
        originalUrl: m.originalUrl,
        thumbUrl: m.thumbUrl,
        width: m.width,
        height: m.height,
      })),
    });
  } catch (error) {
    console.error('Multiple media upload error:', error);
    res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message || 'Failed to upload media',
      },
    });
  }
});

module.exports = router;
