import { Express, RequestHandler } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// @ts-ignore - passport-apple types not available
import AppleStrategy from "@nicokaiser/passport-apple";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { storage } from "./storage";

// Apple JWKS for verifying identity tokens
const appleJWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

// In-memory nonce store for Apple Sign In replay protection
// Format: { nonceHash: expirationTimestamp }
const usedAppleNonces = new Map<string, number>();
const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

// Clean up expired nonces periodically
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiry] of usedAppleNonces.entries()) {
    if (expiry < now) {
      usedAppleNonces.delete(nonce);
    }
  }
}, 60 * 1000); // Clean every minute

// Require SESSION_SECRET to be set for security
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required for JWT authentication');
}

const JWT_SECRET = process.env.SESSION_SECRET;
const SALT_ROUNDS = 10;

// Email transporter setup
let emailTransporter: nodemailer.Transporter | null = null;

// Initialize email transporter if SMTP is configured
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  console.log('🔧 [SMTP] Configuring email transporter...');
  
  // Trim credentials to avoid whitespace issues
  const smtpUser = process.env.SMTP_USER.trim();
  const smtpPass = process.env.SMTP_PASS.trim();
  
  console.log(`📧 [SMTP] Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
  console.log(`👤 [SMTP] User: ${smtpUser}`);
  console.log(`🔒 [SMTP] Secure: ${process.env.SMTP_SECURE === "true" ? "Yes (SSL/TLS)" : "No (STARTTLS)"}`);
  
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  
  console.log('✅ [SMTP] Email transporter initialized successfully');
} else {
  console.log('⚠️  [SMTP] Email not configured - Password reset tokens will be logged to console');
  console.log('💡 [SMTP] To enable emails, set: SMTP_HOST, SMTP_USER, SMTP_PASS');
}

// Function to send password reset email
async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  if (!emailTransporter) {
    console.log('\n🔑 ═══════════════════════════════════════════════════════');
    console.log(`📧 PASSWORD RESET TOKEN for: ${email}`);
    console.log(`🎫 Token: ${token}`);
    console.log(`⏰ Expires: 1 hour from now`);
    console.log('🔑 ═══════════════════════════════════════════════════════\n');
    return true;
  }

  try {
    const resetUrl = `${process.env.APP_URL || "https://kudiloop.replit.dev"}/auth?mode=reset&token=${token}&email=${encodeURIComponent(email)}`;
    
    console.log(`📨 [Email] Sending password reset email to: ${email}`);
    
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@kudiloop.com",
      to: email,
      subject: "KudiLoop Password Reset Request",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">Reset Your KudiLoop Password</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #FF6B35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">Or copy this token and paste it in the reset form:</p>
          <code style="background-color: #f5f5f5; padding: 8px 12px; border-radius: 4px; display: block; margin: 10px 0;">${token}</code>
          <p style="color: #666; font-size: 12px;">This link expires in 1 hour.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    
    console.log(`✅ [Email] Password reset email sent successfully to: ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [Email] Failed to send password reset email to ${email}:`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   SMTP Response: ${error.response}`);
    }
    console.log('\n💡 [Email] Troubleshooting tips:');
    console.log('   1. Check SMTP credentials are correct');
    console.log('   2. Verify your email provider allows SMTP access');
    console.log('   3. For Outlook, ensure you\'re using an App Password (not regular password)');
    console.log('   4. For Outlook/Hotmail, enable "App passwords" at account.microsoft.com/security\n');
    
    // Fallback: Log token to console when email fails
    console.log('🔑 ═══════════════════════════════════════════════════════');
    console.log(`📧 PASSWORD RESET TOKEN (email failed, logging to console)`);
    console.log(`   Email: ${email}`);
    console.log(`   Token: ${token}`);
    console.log(`   Expires: 1 hour from now`);
    console.log('🔑 ═══════════════════════════════════════════════════════\n');
    
    return true; // Return true so the flow continues
  }
}

// Helper function to generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// Helper function to verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

export async function setupCustomAuth(app: Express) {
  // Email/Password Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await storage.createUser({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        authProvider: "email",
      });

      // Create welcome message
      await storage.createMessage({
        type: 'inbox',
        senderId: user.id,
        recipientId: user.id,
        groupId: null,
        content: `Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!`,
      });

      // Generate token
      const token = generateToken(user.id);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Email/Password Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is deleted or banned
      if (user.status === 'deleted') {
        return res.status(403).json({ message: "This account has been deleted" });
      }
      if (user.status === 'banned') {
        return res.status(403).json({ message: "This account has been banned" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate token
      const token = generateToken(user.id);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          preferredName: user.preferredName,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // Google OAuth Setup (if credentials are provided)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Always use absolute URL for mobile app compatibility
    // This must match exactly what's registered in Google Cloud Console
    const googleCallbackURL = 'https://kudiloop.com/api/auth/google/callback';
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: googleCallbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email from Google"));
            }

            // Check if user exists
            let user = await storage.getUserByEmail(email.toLowerCase());

            if (!user) {
              // Create new user
              user = await storage.createUser({
                email: email.toLowerCase(),
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                profileImageUrl: profile.photos?.[0]?.value,
                authProvider: "google",
                authProviderId: profile.id,
              });

              // Create welcome message
              await storage.createMessage({
                type: 'inbox',
                senderId: user.id,
                recipientId: user.id,
                groupId: null,
                content: `Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!`,
              });
            } else {
              // Update existing user with Google info if not already set
              if (!user.authProvider) {
                await storage.updateUser(user.id, {
                  authProvider: "google",
                  authProviderId: profile.id,
                  profileImageUrl: user.profileImageUrl || profile.photos?.[0]?.value,
                });
              }
            }

            done(null, user);
          } catch (error) {
            done(error);
          }
        }
      )
    );

    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: "/auth" }),
      (req, res) => {
        const user = req.user as any;
        const token = generateToken(user.id);
        
        // Redirect to auth page with token
        res.redirect(`/auth?token=${token}`);
      }
    );
  }

  // ============================================================================
  // APPLE SIGN IN - Clean Implementation
  // ============================================================================
  // Supports:
  // 1. Web OAuth flow via passport-apple (callback to /api/auth/apple/callback)
  // 2. Native iOS flow via Capacitor plugin (POST to /api/auth/apple/native)
  // ============================================================================

  // Helper: Format Apple private key for ES256 signing
  function formatApplePrivateKey(rawKey: string): string {
    // Handle escaped newlines and normalize line endings
    let key = rawKey
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    // Extract just the base64 content
    const base64Content = key
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/[\s\n\r]+/g, '');

    // Rebuild with proper PEM format (64 chars per line)
    const lines = base64Content.match(/.{1,64}/g) || [];
    return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
  }

  // Helper: Create or update user from Apple profile
  async function handleAppleUser(
    email: string,
    firstName: string,
    lastName: string,
    appleUserId: string
  ) {
    let user = await storage.getUserByEmail(email.toLowerCase());

    if (!user) {
      // Create new user
      user = await storage.createUser({
        email: email.toLowerCase(),
        firstName: firstName || "",
        lastName: lastName || "",
        authProvider: "apple",
        authProviderId: appleUserId,
      });

      // Create welcome message
      await storage.createMessage({
        type: 'inbox',
        senderId: user.id,
        recipientId: user.id,
        groupId: null,
        content: `Welcome to KudiLoop!\n\nWe're excited to have you join our community of savers. KudiLoop helps you save money with friends, family, and colleagues through rotating savings groups (AJo/ROSCA).\n\nGetting Started:\n1. Create your first savings group or join an existing one\n2. Invite members to participate\n3. Set your contribution amount and schedule\n4. Start saving together!\n\nIf you have any questions or need help, feel free to reach out. Happy saving!`,
      });
    } else if (!user.authProvider) {
      // Link existing user to Apple
      await storage.updateUser(user.id, {
        authProvider: "apple",
        authProviderId: appleUserId,
      });
    }

    return user;
  }

  // Check Apple OAuth configuration
  const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
  const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
  const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
  const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
  
  const appleConfigured = !!(APPLE_CLIENT_ID && APPLE_TEAM_ID && APPLE_KEY_ID && APPLE_PRIVATE_KEY);
  let formattedAppleKey: string | null = null;
  let appleKeyValid = false;

  if (appleConfigured) {
    try {
      formattedAppleKey = formatApplePrivateKey(APPLE_PRIVATE_KEY!);
      crypto.createPrivateKey(formattedAppleKey);
      appleKeyValid = true;
      console.log('[Apple OAuth] Private key validated successfully');
    } catch (err: any) {
      console.error('[Apple OAuth] Private key validation failed:', err.message);
    }
  } else {
    console.log('[Apple OAuth] Not configured - missing one or more secrets');
  }

  // Diagnostic endpoint - always available
  app.get("/api/auth/apple/status", (req, res) => {
    res.json({
      environment: process.env.REPLIT_DEPLOYMENT === '1' ? 'production' : 'development',
      version: 'v2.2', // Increment this to verify deployments
      configured: appleConfigured,
      keyValid: appleKeyValid,
      secrets: {
        APPLE_CLIENT_ID: !!APPLE_CLIENT_ID,
        APPLE_TEAM_ID: !!APPLE_TEAM_ID,
        APPLE_KEY_ID: !!APPLE_KEY_ID,
        APPLE_PRIVATE_KEY: !!APPLE_PRIVATE_KEY,
        keyLength: APPLE_PRIVATE_KEY?.length || 0
      }
    });
  });

  // Test endpoint - verify JWT signing works
  app.get("/api/auth/apple/test", (req, res) => {
    if (!appleConfigured || !appleKeyValid || !formattedAppleKey) {
      return res.status(500).json({
        success: false,
        error: "Apple OAuth not properly configured",
        configured: appleConfigured,
        keyValid: appleKeyValid
      });
    }

    try {
      const testPayload = {
        iss: APPLE_TEAM_ID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        aud: 'https://appleid.apple.com',
        sub: APPLE_CLIENT_ID
      };

      const token = jwt.sign(testPayload, formattedAppleKey, {
        algorithm: 'ES256',
        header: { alg: 'ES256', kid: APPLE_KEY_ID }
      });

      res.json({
        success: true,
        message: "Apple key can sign JWTs successfully",
        tokenPreview: token.substring(0, 50) + "..."
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Web OAuth Flow - only if configured and key is valid
  if (appleConfigured && appleKeyValid && formattedAppleKey) {
    const APPLE_CALLBACK_URL = 'https://kudiloop.com/api/auth/apple/callback';

    passport.use(new AppleStrategy(
      {
        clientID: APPLE_CLIENT_ID,
        teamID: APPLE_TEAM_ID,
        keyID: APPLE_KEY_ID,
        key: formattedAppleKey,
        callbackURL: APPLE_CALLBACK_URL,
        scope: ["name", "email"],
        passReqToCallback: false,
      },
      async (accessToken: any, refreshToken: any, idToken: any, profile: any, done: any) => {
        try {
          console.log('[Apple OAuth] Callback received');
          console.log('[Apple OAuth] Profile:', JSON.stringify(profile, null, 2));
          console.log('[Apple OAuth] ID Token:', JSON.stringify(idToken, null, 2));

          // Get email - Apple provides it in different places
          const email = profile?.email || idToken?.email;
          if (!email) {
            console.error('[Apple OAuth] No email found in profile or idToken');
            return done(new Error("No email received from Apple. Please try again."));
          }

          // Get name if provided (only on first sign-in)
          const firstName = profile?.name?.firstName || "";
          const lastName = profile?.name?.lastName || "";
          const appleUserId = profile?.id || idToken?.sub || "";

          console.log('[Apple OAuth] Creating/updating user:', email);
          const user = await handleAppleUser(email, firstName, lastName, appleUserId);
          
          console.log('[Apple OAuth] User authenticated:', user.id);
          done(null, user);
        } catch (error: any) {
          console.error('[Apple OAuth] Strategy error:', error.message);
          done(error);
        }
      }
    ));

    // Initiate Apple Sign In
    app.get("/api/auth/apple", (req, res, next) => {
      console.log('[Apple OAuth] Initiating sign in');
      passport.authenticate("apple")(req, res, next);
    });

    // Apple callback - POST method (Apple sends form data)
    // Wrapped in multiple layers of error handling
    app.post("/api/auth/apple/callback", (req, res) => {
      // Outer synchronous try-catch to catch any initialization errors
      try {
        console.log('[Apple OAuth] ===== CALLBACK START =====');
        console.log('[Apple OAuth] Body:', JSON.stringify(req.body || {}, null, 2));
        
        // Apple sends: code, id_token, state, and optionally user (JSON string with name/email)
        const body = req.body || {};
        const { code, id_token, state, user: userJson, error: appleError } = body;
        
        // Check if Apple returned an error
        if (appleError) {
          console.error('[Apple OAuth] Apple returned error:', appleError);
          return res.redirect(`/auth?error=apple_denied&message=${encodeURIComponent(String(appleError))}`);
        }
        
        if (!code && !id_token) {
          console.error('[Apple OAuth] No code or id_token received');
          return res.redirect('/auth?error=apple_no_token&message=No+authorization+code+received');
        }

        console.log('[Apple OAuth] Has code:', !!code, 'Has id_token:', !!id_token);

        // If Apple sent user info (first sign-in only), parse it
        if (userJson) {
          try {
            const parsed = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
            console.log('[Apple OAuth] User info received:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('[Apple OAuth] Could not parse user info');
          }
        }

        // Use passport to complete the authentication
        console.log('[Apple OAuth] Calling passport.authenticate...');
        
        passport.authenticate("apple", { session: false }, (err: any, user: any, info: any) => {
          try {
            console.log('[Apple OAuth] Passport callback received');
            
            if (err) {
              console.error('[Apple OAuth] Passport error:', err.message || err);
              if (!res.headersSent) {
                return res.redirect(`/auth?error=apple_auth_failed&message=${encodeURIComponent(err.message || 'Authentication error')}`);
              }
              return;
            }
            
            if (!user) {
              console.error('[Apple OAuth] No user from passport, info:', info);
              if (!res.headersSent) {
                return res.redirect(`/auth?error=apple_auth_failed&message=${encodeURIComponent(info?.message || 'No user returned')}`);
              }
              return;
            }

            console.log('[Apple OAuth] User authenticated successfully:', user.id);
            const token = generateToken(user.id);
            res.redirect(`/auth?token=${token}`);
          } catch (callbackErr: any) {
            console.error('[Apple OAuth] Callback processing error:', callbackErr.message);
            if (!res.headersSent) {
              res.redirect(`/auth?error=apple_auth_failed&message=${encodeURIComponent(callbackErr.message || 'Callback error')}`);
            }
          }
        })(req, res, (nextErr: any) => {
          if (nextErr) {
            console.error('[Apple OAuth] Next middleware error:', nextErr.message || nextErr);
            if (!res.headersSent) {
              res.redirect(`/auth?error=apple_auth_failed&message=${encodeURIComponent(nextErr.message || 'Middleware error')}`);
            }
          }
        });
      } catch (outerErr: any) {
        console.error('[Apple OAuth] ===== OUTER ERROR =====');
        console.error('[Apple OAuth] Error:', outerErr.message || outerErr);
        console.error('[Apple OAuth] Stack:', outerErr.stack);
        
        if (!res.headersSent) {
          res.redirect(`/auth?error=apple_auth_failed&message=${encodeURIComponent(outerErr.message || 'Unexpected error')}`);
        }
      }
    });
  } else {
    // Apple OAuth not available - provide helpful error routes
    app.get("/api/auth/apple", (req, res) => {
      res.redirect('/auth?error=apple_not_configured');
    });
    
    app.post("/api/auth/apple/callback", (req, res) => {
      res.redirect('/auth?error=apple_not_configured');
    });
  }

  // Native iOS Apple Sign In - validates identity token from Capacitor plugin
  app.post("/api/auth/apple/native", async (req, res) => {
    console.log('[Apple Native] Request received');
    
    try {
      const { identityToken, email, givenName, familyName, user: appleUserId, nonce } = req.body;

      if (!identityToken) {
        return res.status(400).json({ error: "Identity token is required" });
      }

      if (!nonce) {
        return res.status(400).json({ error: "Nonce is required for authentication" });
      }

      // Verify the identity token using Apple's JWKS
      let payload;
      try {
        const result = await jwtVerify(identityToken, appleJWKS, {
          issuer: 'https://appleid.apple.com',
          audience: 'com.kudiloop.app',
        });
        payload = result.payload;
        console.log('[Apple Native] Token verified successfully');
      } catch (verifyError: any) {
        console.error('[Apple Native] Token verification failed:', verifyError.message);
        return res.status(401).json({ error: "Invalid or expired identity token" });
      }

      // Validate nonce for replay protection
      const nonceHash = crypto.createHash('sha256').update(nonce).digest('base64url');
      
      if (!payload.nonce || payload.nonce !== nonceHash) {
        console.error('[Apple Native] Nonce mismatch');
        return res.status(401).json({ error: "Invalid nonce - authentication rejected" });
      }

      // Check for replay attacks
      if (usedAppleNonces.has(nonceHash)) {
        console.error('[Apple Native] Nonce already used');
        return res.status(401).json({ error: "Token already used" });
      }
      usedAppleNonces.set(nonceHash, Date.now() + NONCE_TTL_MS);

      // Get email from request or token
      const userEmail = email || (payload.email as string);
      if (!userEmail) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Create or get user
      const user = await handleAppleUser(
        userEmail,
        givenName || "",
        familyName || "",
        appleUserId || (payload.sub as string)
      );

      const token = generateToken(user.id);
      console.log('[Apple Native] User authenticated:', user.id);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error: any) {
      console.error('[Apple Native] Error:', error.message);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Forgot Password - Generate reset token and send email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.status(200).json({
          success: true,
          message: "If an account exists with this email, you will receive a password reset link",
        });
      }

      // Generate reset token (32 character hex string)
      const resetToken = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration

      // Update user with reset token and expiration
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt,
      });

      // Send password reset email
      await sendPasswordResetEmail(email, resetToken);

      res.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link",
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset Password - Verify token and update password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;

      if (!email || !token || !newPassword) {
        return res.status(400).json({ message: "Email, token, and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(404).json({ message: "No account found with this email" });
      }

      // Verify reset token
      if (!user.passwordResetToken || user.passwordResetToken !== token) {
        return res.status(401).json({ message: "Invalid reset token" });
      }

      // Check token expiration
      if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
        return res.status(401).json({ message: "Reset token has expired" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update user password and clear reset token
      await storage.updateUser(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      // Generate new login token
      const loginToken = generateToken(user.id);

      res.json({
        success: true,
        message: "Password reset successfully",
        token: loginToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Logout endpoint (client-side will remove token)
  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });
}

// Middleware to authenticate requests using JWT
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  (req as any).userId = decoded.userId;
  next();
};
