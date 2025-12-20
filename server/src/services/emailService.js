const nodemailer = require('nodemailer');
const config = require('../config');

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter && config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(user) {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not configured, skipping welcome email');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
    .content { padding: 30px; }
    .content h2 { color: #333; }
    .content p { color: #666; line-height: 1.6; }
    .features { background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .feature { display: flex; align-items: center; margin: 10px 0; }
    .feature-icon { font-size: 24px; margin-right: 15px; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; }
    .footer { background: #f5f5f5; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏔️ NomadWay</h1>
      <p>Discover Kazakhstan's Hidden Treasures</p>
    </div>
    <div class="content">
      <h2>Welcome, ${user.fullName || user.displayName || 'Traveler'}! 🎉</h2>
      <p>Thank you for joining NomadWay! You're now part of a community of explorers discovering the incredible beauty of Kazakhstan.</p>
      
      <div class="features">
        <div class="feature">
          <span class="feature-icon">🗺️</span>
          <span>AI-powered route planning tailored to your interests</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🏆</span>
          <span>Earn achievements as you explore new places</span>
        </div>
        <div class="feature">
          <span class="feature-icon">👥</span>
          <span>Connect with fellow travelers in our community</span>
        </div>
        <div class="feature">
          <span class="feature-icon">💬</span>
          <span>Get expert advice from our AI travel guide</span>
        </div>
      </div>
      
      <div class="cta">
        <a href="${config.frontendUrl}">Start Exploring</a>
      </div>
      
      <p>Happy travels! 🌟</p>
      <p><strong>The NomadWay Team</strong></p>
    </div>
    <div class="footer">
      <p>NomadWay - Your Gateway to Kazakhstan Adventure</p>
      <p>© ${new Date().getFullYear()} NomadWay. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: config.email.from,
      to: user.email,
      subject: '🏔️ Welcome to NomadWay - Your Kazakhstan Adventure Begins!',
      html,
    });
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(user, resetToken) {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not configured, skipping password reset email');
    return;
  }

  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .content h2 { color: #333; }
    .content p { color: #666; line-height: 1.6; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; color: #856404; }
    .footer { background: #f5f5f5; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hello ${user.fullName || user.displayName || 'there'},</p>
      <p>We received a request to reset your password for your NomadWay account. Click the button below to create a new password:</p>
      
      <div class="cta">
        <a href="${resetUrl}">Reset Password</a>
      </div>
      
      <div class="warning">
        ⚠️ This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #999;">${resetUrl}</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NomadWay. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: config.email.from,
      to: user.email,
      subject: '🔐 Reset Your NomadWay Password',
      html,
    });
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
}

/**
 * Send route summary email
 */
async function sendRouteSummaryEmail(user, route) {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not configured, skipping route summary email');
    return;
  }

  const stopsHtml = route.stops.map((stop, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${stop.attraction?.name || stop.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${stop.visitDuration || 60} min</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">₸${stop.estimatedCost || 0}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 12px; text-align: left; }
    .summary { background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .summary-item { display: flex; justify-content: space-between; margin: 10px 0; }
    .footer { background: #f5f5f5; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗺️ Your AI Route</h1>
    </div>
    <div class="content">
      <h2>${route.name || 'Your Custom Route'}</h2>
      <p>Here's your personalized travel route created by NomadWay AI:</p>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Destination</th>
            <th>Duration</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${stopsHtml}
        </tbody>
      </table>
      
      <div class="summary">
        <h3>📊 Route Summary</h3>
        <div class="summary-item">
          <span>Total Duration:</span>
          <strong>${route.totalDuration || 0} minutes</strong>
        </div>
        <div class="summary-item">
          <span>Estimated Cost:</span>
          <strong>₸${route.totalCost || 0}</strong>
        </div>
        <div class="summary-item">
          <span>Number of Stops:</span>
          <strong>${route.stops?.length || 0}</strong>
        </div>
      </div>
      
      <p>Have a wonderful journey! 🌟</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NomadWay. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: config.email.from,
      to: user.email,
      subject: '🗺️ Your NomadWay AI Route is Ready!',
      html,
    });
    console.log(`Route summary email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send route summary email:', error);
  }
}

/**
 * Send verification email
 */
async function sendVerificationEmail(user, verifyToken) {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email not configured, skipping verification email');
    return;
  }

  const verifyUrl = `${config.frontendUrl}/verify-email?token=${verifyToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .content { padding: 30px; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { display: inline-block; background: #FF6B35; color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Verify Your Email</h1>
    </div>
    <div class="content">
      <h2>Almost there!</h2>
      <p>Please verify your email address to complete your NomadWay registration.</p>
      <div class="cta">
        <a href="${verifyUrl}">Verify Email</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NomadWay</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: config.email.from,
      to: user.email,
      subject: '✉️ Verify Your NomadWay Email',
      html,
    });
    console.log(`Verification email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendRouteSummaryEmail,
  sendVerificationEmail,
};
