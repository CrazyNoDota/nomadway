const express = require('express');
const crypto = require('crypto');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Hash IP address for privacy
 */
function hashIP(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex').substring(0, 16);
}

/**
 * Extract country from IP (simplified - in production use a geo-IP service)
 */
function getCountryFromIP(ip) {
  // In production, integrate with a service like MaxMind GeoIP2 or ip-api.com
  // For now, return null - can be enhanced later
  return null;
}

/**
 * POST /api/analytics/visit
 * Log a page visit
 */
router.post('/visit', async (req, res) => {
  try {
    const { page = '/', referrer } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const visit = await prisma.webVisit.create({
      data: {
        ipHash: hashIP(ip),
        userAgent: userAgent?.substring(0, 500), // Limit length
        country: getCountryFromIP(ip),
        page,
        referrer: referrer?.substring(0, 500),
      },
    });
    
    res.status(201).json({ 
      success: true, 
      id: visit.id 
    });
  } catch (error) {
    console.error('Error logging visit:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log visit' 
    });
  }
});

/**
 * POST /api/analytics/download
 * Log an APK download
 */
router.post('/download', async (req, res) => {
  try {
    const { version = '1.0.0', platform = 'android' } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const download = await prisma.appDownload.create({
      data: {
        version,
        platform,
        ipHash: hashIP(ip),
        country: getCountryFromIP(ip),
        userAgent: userAgent?.substring(0, 500),
      },
    });
    
    res.status(201).json({ 
      success: true, 
      id: download.id 
    });
  } catch (error) {
    console.error('Error logging download:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log download' 
    });
  }
});

/**
 * POST /api/analytics/event
 * Log an in-app event from mobile app
 */
router.post('/event', async (req, res) => {
  try {
    const { 
      userId, 
      eventType, 
      eventName, 
      metadata, 
      deviceId, 
      platform, 
      appVersion 
    } = req.body;
    
    // Validate required fields
    if (!eventType || !eventName) {
      return res.status(400).json({
        success: false,
        error: 'eventType and eventName are required',
      });
    }
    
    // Validate eventType enum
    const validEventTypes = ['VIEW', 'ACTION', 'ERROR'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        success: false,
        error: `eventType must be one of: ${validEventTypes.join(', ')}`,
      });
    }
    
    const event = await prisma.appEvent.create({
      data: {
        userId: userId || null,
        eventType,
        eventName,
        metadata: metadata || null,
        deviceId: deviceId || null,
        platform: platform || null,
        appVersion: appVersion || null,
      },
    });
    
    res.status(201).json({
      success: true,
      id: event.id,
    });
  } catch (error) {
    console.error('Error logging app event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log event',
    });
  }
});

/**
 * POST /api/analytics/events/batch
 * Log multiple in-app events at once (for offline sync)
 */
router.post('/events/batch', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'events array is required',
      });
    }
    
    // Validate and prepare events
    const validEventTypes = ['VIEW', 'ACTION', 'ERROR'];
    const validEvents = events.filter(e => 
      e.eventType && 
      e.eventName && 
      validEventTypes.includes(e.eventType)
    ).map(e => ({
      userId: e.userId || null,
      eventType: e.eventType,
      eventName: e.eventName,
      metadata: e.metadata || null,
      deviceId: e.deviceId || null,
      platform: e.platform || null,
      appVersion: e.appVersion || null,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
    }));
    
    const result = await prisma.appEvent.createMany({
      data: validEvents,
    });
    
    res.status(201).json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error('Error logging batch events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log events',
    });
  }
});

/**
 * GET /api/analytics/stats
 * Get aggregated analytics data (Admin only)
 */
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    // Get total counts
    const [
      totalUsers,
      totalVisits,
      totalDownloads,
      activeUsersLast7Days,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true, isDeleted: false } }),
      prisma.webVisit.count(),
      prisma.appDownload.count(),
      prisma.user.count({
        where: {
          isActive: true,
          isDeleted: false,
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);
    
    // Get visits per day for the chart
    const visitsPerDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM web_visits 
      WHERE created_at >= ${daysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    // Get downloads per day for the chart
    const downloadsPerDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM app_downloads 
      WHERE created_at >= ${daysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    // Get visits by country
    const visitsByCountry = await prisma.webVisit.groupBy({
      by: ['country'],
      _count: { id: true },
      where: { 
        createdAt: { gte: daysAgo },
        country: { not: null },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    
    // Get recent signups
    const recentSignups = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    // Get downloads by version
    const downloadsByVersion = await prisma.appDownload.groupBy({
      by: ['version'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
    
    // Get top 5 most visited screens (in-app analytics)
    const topScreens = await prisma.appEvent.groupBy({
      by: ['eventName'],
      _count: { id: true },
      where: {
        eventType: 'VIEW',
        timestamp: { gte: daysAgo },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
    
    // Get most common user actions (in-app analytics)
    const topActions = await prisma.appEvent.groupBy({
      by: ['eventName'],
      _count: { id: true },
      where: {
        eventType: 'ACTION',
        timestamp: { gte: daysAgo },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    
    // Get total app events count
    const totalAppEvents = await prisma.appEvent.count({
      where: { timestamp: { gte: daysAgo } },
    });
    
    // Get app events by type
    const eventsByType = await prisma.appEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
      where: { timestamp: { gte: daysAgo } },
    });
    
    // Build daily data for charts (fill in missing days with 0)
    const dailyData = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const visitData = visitsPerDay.find(v => 
        new Date(v.date).toISOString().split('T')[0] === dateStr
      );
      const downloadData = downloadsPerDay.find(d => 
        new Date(d.date).toISOString().split('T')[0] === dateStr
      );
      
      dailyData.push({
        date: dateStr,
        visits: visitData ? Number(visitData.count) : 0,
        downloads: downloadData ? Number(downloadData.count) : 0,
      });
    }
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalVisits,
          totalDownloads,
          activeUsersLast7Days,
          totalAppEvents,
          conversionRate: totalVisits > 0 
            ? ((totalDownloads / totalVisits) * 100).toFixed(2) 
            : 0,
        },
        dailyData,
        visitsByCountry: visitsByCountry.map(v => ({
          country: v.country || 'Unknown',
          count: v._count.id,
        })),
        downloadsByVersion: downloadsByVersion.map(d => ({
          version: d.version,
          count: d._count.id,
        })),
        // In-app analytics
        topScreens: topScreens.map(s => ({
          screen: s.eventName,
          views: s._count.id,
        })),
        topActions: topActions.map(a => ({
          action: a.eventName,
          count: a._count.id,
        })),
        eventsByType: eventsByType.map(e => ({
          type: e.eventType,
          count: e._count.id,
        })),
        recentSignups: recentSignups.map(u => ({
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics stats' 
    });
  }
});

/**
 * GET /api/analytics/stats/public
 * Get public stats for display on landing page (no auth required)
 */
router.get('/stats/public', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get total counts
    const [totalUsers, totalDownloads, totalVisits, totalPlaces] = await Promise.all([
      prisma.user.count({ where: { isActive: true, isDeleted: false } }),
      prisma.appDownload.count(),
      prisma.webVisit.count(),
      prisma.attraction.count(),
    ]);
    
    // Get visits per day for the chart
    const visitsPerDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM web_visits 
      WHERE created_at >= ${daysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    // Get downloads per day for the chart
    const downloadsPerDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM app_downloads 
      WHERE created_at >= ${daysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    // Build daily data for charts (fill in missing days with 0)
    const dailyData = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const visitData = visitsPerDay.find(v => 
        new Date(v.date).toISOString().split('T')[0] === dateStr
      );
      const downloadData = downloadsPerDay.find(d => 
        new Date(d.date).toISOString().split('T')[0] === dateStr
      );
      
      dailyData.push({
        date: dateStr,
        label: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        visits: visitData ? Number(visitData.count) : 0,
        downloads: downloadData ? Number(downloadData.count) : 0,
      });
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDownloads,
        totalVisits,
        totalPlaces,
        dailyData,
      },
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stats' 
    });
  }
});

module.exports = router;
