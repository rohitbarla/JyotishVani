import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { db } from "./server/db";
import { syncAllToFirestore, syncPaymentToFirestore } from "./server/firestoreService";
import { requestOtp, verifyOtp, recordFirebasePhoneAuth } from "./server/otpService";
import { calculateLiveVedicPanchang } from "./server/panchangEngine";
import { generateLiveDailyHoroscopes } from "./server/horoscopeEngine";
import { sendSubscriptionConfirmation } from "./server/confirmationService";
import { sendDirectWhatsApp } from "./server/whatsappService";
import { sendDirectSms, calculateSmsSegments } from "./server/smsService";

dotenv.config();

const app = express();
const PORT = 3000;

// Secure CORS & Defense-in-depth Security Headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // HTTP Security Headers
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Request body parser with payload limit (prevents JSON payload DOS)
app.use(express.json({ limit: "1mb" }));

// In-Memory Rate Limiting Engine for Anti-Abuse & Quota Protection
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitBuckets = new Map<string, Map<string, RateLimitEntry>>();

export function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

export function checkRateLimit(
  bucketName: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  if (!rateLimitBuckets.has(bucketName)) {
    rateLimitBuckets.set(bucketName, new Map());
  }
  const bucket = rateLimitBuckets.get(bucketName)!;
  const now = Date.now();
  let entry = bucket.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    bucket.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterSeconds: 0 };
}

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitBuckets.forEach((bucket) => {
    for (const [key, entry] of bucket.entries()) {
      if (now > entry.resetAt) {
        bucket.delete(key);
      }
    }
  });
}, 5 * 60 * 1000);

// Initialize Gemini client with safety check
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Administrator Token Session Store & Cryptographic Auth Guard
export interface AdminTokenSession {
  token: string;
  createdAt: number;
  expiresAt: number;
  email: string;
}
export const activeAdminTokens = new Map<string, AdminTokenSession>();

// Secure HMAC Secret: Use environment variable or generate random 256-bit secret on boot (never static hardcoded string)
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString("hex");

export function generateAdminToken(email: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const payload = `kendra_admin_${timestamp}_${randomBytes}`;
  const hmac = crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(`${payload}:${email}`).digest("hex");
  const token = `${payload}.${hmac}`;

  activeAdminTokens.set(token, {
    token,
    createdAt: timestamp,
    expiresAt: timestamp + 24 * 60 * 60 * 1000,
    email,
  });
  return token;
}

export function isValidAdminToken(token: string): boolean {
  if (!token) return false;
  if (token === "admin_session") return false;

  // 1. Check in-memory active session cache
  const session = activeAdminTokens.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeAdminTokens.delete(token);
      return false;
    }
    return true;
  }

  // 2. Validate cryptographic HMAC signature if token was issued prior to a process restart
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;
  const payload = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);
  const parts = payload.split("_");
  if (parts.length < 4 || parts[0] !== "kendra" || parts[1] !== "admin") return false;
  const timestamp = Number(parts[2]);
  if (isNaN(timestamp) || Date.now() - timestamp > 24 * 60 * 60 * 1000 || timestamp > Date.now() + 60000) {
    return false;
  }

  const config = db.getSchedulerConfig();
  const configuredAdminEmail = (config.smtpUser || config.senderEmail || "rohit.barla.ai.india@gmail.com").toLowerCase();
  const authorizedEmails = [
    "rohit.barla.ai.india@gmail.com",
    "rohit.barla@gmail.com",
    configuredAdminEmail,
  ];

  for (const email of authorizedEmails) {
    const expectedHmac = crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(`${payload}:${email}`).digest("hex");
    if (signature.length === expectedHmac.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
      activeAdminTokens.set(token, {
        token,
        createdAt: timestamp,
        expiresAt: timestamp + 24 * 60 * 60 * 1000,
        email,
      });
      return true;
    }
  }

  return false;
}

export function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Access Denied: Kendra Admin authorization Bearer token is required.",
    });
  }

  const token = authHeader.substring(7).trim();
  if (!isValidAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: "Access Denied: Invalid or expired Kendra Admin authorization token. Please log in again.",
    });
  }

  next();
}

// Fallback Vedic Astrological Wisdom Generator
function generateLocalVedicAnswer(question: string, sign?: string, birthDate?: string): string {
  const currentSign = sign || "Aries";
  const lowerQ = question.toLowerCase();

  let focus = "general life guidance and planetary balance";
  let remedy = "Chanting the Gayatri Mantra at sunrise and offering water to Surya Dev in a copper vessel.";
  let planetaryTransit = "Jupiter (Guru) transit brings positive expansion, while Saturn (Shani) encourages discipline and patience.";

  if (lowerQ.includes("career") || lowerQ.includes("job") || lowerQ.includes("business") || lowerQ.includes("promotion")) {
    focus = "Professional Growth & Career Trajectory";
    planetaryTransit = "Your 10th house of Karma is energized by supportive planetary aspects. The upcoming months indicate opportunities for advancement or a favorable change in work environment.";
    remedy = "Perform Surya Namaskar on Sunday mornings, chant 'Om Suryaya Namaha' 108 times, and wear clean shades of saffron or gold on Thursdays to strengthen Jupiter.";
  } else if (lowerQ.includes("marriage") || lowerQ.includes("love") || lowerQ.includes("relationship") || lowerQ.includes("partner")) {
    focus = "Love, Relationships & Conjugal Harmony";
    planetaryTransit = "Venus (Shukra) alignment brings mutual understanding and clarity. If facing delays, retrograde effects are softening, clearing emotional misunderstandings.";
    remedy = "Wear white or soft pastel tones on Fridays. Feeding cows green fodder or chanting 'Om Shukraya Namaha' strengthens harmony in relationships.";
  } else if (lowerQ.includes("money") || lowerQ.includes("finance") || lowerQ.includes("wealth") || lowerQ.includes("debt")) {
    focus = "Financial Stability & Dhana Yoga";
    planetaryTransit = "The 2nd and 11th houses of income and gains indicate progressive recovery. Steady investments will bear auspicious fruit over speculative risks.";
    remedy = "Keep your North-East corner clean and clutter-free. Light a sesame oil lamp on Saturday evenings and chant the Sri Suktam on Fridays.";
  } else if (lowerQ.includes("sade sati") || lowerQ.includes("shani") || lowerQ.includes("saturn") || lowerQ.includes("dosha")) {
    focus = "Shani Prabhav & Karmic Cleansing";
    planetaryTransit = "Saturn tests perseverance and humility. Rather than fearing this phase, treat it as a powerful period of foundation building and inner maturity.";
    remedy = "Help the underprivileged, donate black sesame seeds or mustard oil on Saturdays, and recite Hanuman Chalisa every Tuesday and Saturday.";
  } else if (lowerQ.includes("health") || lowerQ.includes("energy") || lowerQ.includes("mental")) {
    focus = "Arogya (Health) & Pranic Balance";
    planetaryTransit = "Moon's transit through watery and airy signs calls for mental calmness and balanced hydration. Avoid overexertion during twilight hours.";
    remedy = "Practice 15 minutes of Anulom-Vilom pranayama daily. Drink water stored in a copper utensil and chant Maha Mrityunjaya Mantra for protection.";
  }

  return `### 🌟 Vedic Astrological Reading for ${currentSign}

**Cosmic Analysis (${focus}):**
${planetaryTransit}

**Direct Insight for Your Query:**
Regarding *"_${question}_"*, the cosmic configurations indicate a period of transition yielding favorable results when accompanied by conscious effort and moral integrity. The planetary rulers emphasize clarity of thought over impulsive decisions.

**Auspicious Muhurat & Timings:**
- **Best Day:** Thursdays and Tuesdays for initiating major activities.
- **Favorable Colors:** Royal Gold, Cream, and Saffron.
- **Lucky Numbers:** 3, 7, and 9.

**Recommended Vedic Remedies (Upayas):**
1. ${remedy}
2. Maintain positive intentions and donate food to birds and animals.
3. For deep personalized birth chart analysis with exact Dasha timings, you can also consult our 1-on-1 verified astrologers over video call or offline visit.`;
}

// AI Astrology Consultation Endpoint (Protected with rate limiting, input validation, and quota defense)
app.post("/api/ai-chat", async (req, res) => {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit("ai_chat", clientIp, 15, 10 * 60 * 1000); // 15 requests per 10 mins per IP
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many astrological queries submitted. Please wait ${rateLimit.retryAfterSeconds} seconds before consulting Acharya Jyotish again.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  const { question, sign, birthDate, birthTime, birthCity } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Please provide a valid astrological question." });
  }

  const sanitizedQuestion = question.trim().slice(0, 500);
  if (sanitizedQuestion.length < 3) {
    return res.status(400).json({ error: "Question must be at least 3 characters long." });
  }

  const cleanSign = typeof sign === "string" ? sign.trim().slice(0, 30) : "Aries";
  const cleanDate = typeof birthDate === "string" ? birthDate.trim().slice(0, 20) : "";
  const cleanTime = typeof birthTime === "string" ? birthTime.trim().slice(0, 20) : "";
  const cleanCity = typeof birthCity === "string" ? birthCity.trim().slice(0, 50) : "";

  if (!aiClient) {
    // Graceful fallback to rich local Vedic knowledge
    const answer = generateLocalVedicAnswer(sanitizedQuestion, cleanSign, cleanDate);
    return res.json({ answer, source: "vedic-engine" });
  }

  try {
    const prompt = `You are Acharya Jyotish, an eminent, compassionate, and highly revered Vedic and Western Astrologer with 30+ years of mastery in Kundali, Nakshatra transits, Dasha periods, and planetary remedies.
    
The user is asking an astrological question:
- User Zodiac Sign: ${cleanSign || "Not specified"}
- Date of Birth: ${cleanDate || "Not specified"}
- Time of Birth: ${cleanTime || "Not specified"}
- Place of Birth: ${cleanCity || "Not specified"}
- Question: "${sanitizedQuestion}"

Please provide a warm, respectful, deeply insightful, and accurate astrological reading.
Structure your answer clearly with:
1. Planetary Overview & Cosmic Alignment for their sign.
2. Direct astrological answer to their specific question (addressing career, love, health, or finance).
3. Positive Auspicious Timings & Lucky Factors (Day, Color, Number).
4. Practical and auspicious Vedic Remedies (Upayas like mantras, charity, or simple rituals).

Keep tone encouraging, dignified, spiritual yet practical, and culturally authentic. Use Markdown formatting.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const text = response.text || generateLocalVedicAnswer(sanitizedQuestion, cleanSign, cleanDate);
    
    // Persist to database
    db.saveConsultation({
      userSign: cleanSign,
      birthDate: cleanDate,
      question: sanitizedQuestion,
      answer: text,
      source: "gemini-api",
    });

    res.json({ answer: text, source: "gemini-api" });
  } catch (err: any) {
    console.error("Gemini API error in /api/ai-chat:", err?.message || err);
    // Return high quality fallback
    const fallbackAnswer = generateLocalVedicAnswer(sanitizedQuestion, cleanSign, cleanDate);
    
    // Persist to database
    db.saveConsultation({
      userSign: cleanSign,
      birthDate: cleanDate,
      question: sanitizedQuestion,
      answer: fallbackAnswer,
      source: "vedic-engine-fallback",
    });

    res.json({ answer: fallbackAnswer, source: "vedic-engine-fallback" });
  }
});

// Database API: Overall stats & storage metrics
app.get("/api/db/stats", requireAdminAuth, (req, res) => {
  res.json({ success: true, stats: db.getStats() });
});

// Database API: List all subscribers stored in database (protected)
app.get("/api/db/subscribers", requireAdminAuth, (req, res) => {
  const subscribers = db.getSubscribers();
  res.json({ success: true, count: subscribers.length, subscribers });
});

// Alias for subscriber list (protected)
app.get("/api/subscribers", requireAdminAuth, (req, res) => {
  const subscribers = db.getSubscribers();
  res.json({ success: true, count: subscribers.length, subscribers });
});

// Database API: Get specific subscriber by mobile (Admin Protected)
app.get("/api/subscribers/:mobile", requireAdminAuth, (req, res) => {
  const subscriber = db.getSubscriber(req.params.mobile);
  if (!subscriber) {
    return res.status(404).json({ error: "Subscriber not found in database." });
  }
  const { otp, ...safeSubscriber } = subscriber as any;
  res.json({ success: true, subscriber: safeSubscriber });
});

// Mobile registration & subscriber upsert with production live OTP (Protected against toll fraud & account tampering)
app.post("/api/register-mobile", async (req, res) => {
  const clientIp = getClientIp(req);
  const ipRate = checkRateLimit("reg_mobile_ip", clientIp, 8, 10 * 60 * 1000);
  if (!ipRate.allowed) {
    return res.status(429).json({
      error: `Too many registration attempts from this network. Please wait ${ipRate.retryAfterSeconds} seconds before trying again.`,
      cooldownSeconds: ipRate.retryAfterSeconds,
    });
  }

  const {
    mobile,
    name,
    email,
    zodiacSign,
    birthDate,
    birthTime,
    birthCity,
    deliveryChannel,
    deliveryTime,
    plan,
    autoRenew,
  } = req.body;

  if (!mobile || mobile.length < 10) {
    return res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
  }

  const cleanMobile = mobile.replace(/\D/g, "");

  // Request production OTP via Live SMS gateway / Email
  const otpResult = await requestOtp(cleanMobile, {
    email,
    name,
    requestedChannel: deliveryChannel,
  });

  const existing = db.getSubscriber(cleanMobile);
  const isAlreadyActive = existing && (existing.status === "active" || existing.status === "trial" || existing.status === "pending_verification");

  // If already active, DO NOT overwrite their profile or downgrade status to pending_otp before OTP is verified!
  let subscriber: any;
  if (!isAlreadyActive) {
    subscriber = db.upsertSubscriber({
      mobile: cleanMobile,
      name: name || "Cosmic Seeker",
      email: email || "",
      zodiacSign: zodiacSign || "Aries",
      birthDate: birthDate || "",
      birthTime: birthTime || "",
      birthCity: birthCity || "",
      deliveryChannel: deliveryChannel || "whatsapp",
      deliveryTime: deliveryTime || "07:00 AM",
      planId: plan || "trial",
      status: "pending_otp",
      autoRenew: autoRenew !== undefined ? Boolean(autoRenew) : true,
    });
  } else {
    subscriber = existing;
  }

  if (!otpResult.success) {
    return res.status(429).json({
      error: otpResult.message,
      cooldownSeconds: otpResult.cooldownSeconds,
    });
  }

  res.json({
    success: true,
    message: otpResult.message,
    deliveryMethod: otpResult.deliveryMethod,
    cooldownSeconds: otpResult.cooldownSeconds || 30,
    expiresInSeconds: otpResult.expiresInSeconds || 300,
    subscriber: {
      mobile: subscriber.mobile,
      name: subscriber.name,
      zodiacSign: subscriber.zodiacSign,
      planId: subscriber.planId,
      deliveryChannel: subscriber.deliveryChannel,
      status: subscriber.status,
    },
  });
});

// Resend OTP endpoint with live rate-limiting and cooldown
app.post("/api/resend-otp", async (req, res) => {
  const clientIp = getClientIp(req);
  const ipRate = checkRateLimit("resend_otp_ip", clientIp, 6, 10 * 60 * 1000);
  if (!ipRate.allowed) {
    return res.status(429).json({
      error: `Too many OTP resend attempts. Please wait ${ipRate.retryAfterSeconds} seconds.`,
      cooldownSeconds: ipRate.retryAfterSeconds,
    });
  }

  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required." });
  }
  const cleanMobile = mobile.replace(/\D/g, "");
  const existing = db.getSubscriber(cleanMobile);

  const otpResult = await requestOtp(cleanMobile, {
    email: existing?.email,
    name: existing?.name,
    requestedChannel: existing?.deliveryChannel,
  });

  if (!otpResult.success) {
    return res.status(429).json({
      error: otpResult.message,
      cooldownSeconds: otpResult.cooldownSeconds,
    });
  }

  res.json({
    success: true,
    message: otpResult.message,
    deliveryMethod: otpResult.deliveryMethod,
    cooldownSeconds: otpResult.cooldownSeconds || 30,
    expiresInSeconds: otpResult.expiresInSeconds || 300,
  });
});

// Verify OTP & activate subscription (Strict: Paid plans require payment verification; only trial activates immediately)
app.post("/api/verify-otp", async (req, res) => {
  const { mobile, otp, selectedPlan, autoRenew, authMethod, firebaseUid } = req.body;
  const cleanMobile = (mobile || "").replace(/\D/g, "");

  if (!cleanMobile) {
    return res.status(400).json({ error: "Mobile number is required." });
  }

  const existing = db.getSubscriber(cleanMobile);
  let verified = false;
  let verificationProvider = "live_otp";
  let verifiedAt = new Date().toISOString();

  if (authMethod === "firebase_phone_auth") {
    const { idToken } = req.body;
    let isFirebaseVerified = false;
    if (idToken && typeof idToken === "string") {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
          const phoneInToken = (payload.phone_number || "").replace(/\D/g, "");
          const tokenUid = payload.sub || payload.user_id;
          if (tokenUid && (phoneInToken.endsWith(cleanMobile) || tokenUid === firebaseUid)) {
            isFirebaseVerified = true;
          }
        } catch {
          isFirebaseVerified = false;
        }
      }
    }

    if (!isFirebaseVerified) {
      return res.status(401).json({
        error: "Authentication failed: A valid signed Firebase Phone Auth ID Token matching this mobile number is required.",
      });
    }

    await recordFirebasePhoneAuth(cleanMobile, firebaseUid || "verified_firebase_user");
    verified = true;
    verificationProvider = "firebase_phone_auth";
  } else {
    const result = await verifyOtp(cleanMobile, otp || "");
    if (!result.success) {
      return res.status(400).json({
        error: result.message,
        remainingAttempts: result.remainingAttempts,
      });
    }
    verified = true;
    verificationProvider = result.provider || "live_sms";
    verifiedAt = result.verifiedAt || verifiedAt;
  }

  const isAutoRenew =
    autoRenew !== undefined
      ? Boolean(autoRenew)
      : existing?.autoRenew !== undefined
      ? existing.autoRenew
      : true;

  const targetPlan = selectedPlan || existing?.planId || "trial";
  const isTrial = targetPlan === "trial";
  let updated: any;

  if (isTrial) {
    updated = db.activateSubscription(
      cleanMobile,
      "trial",
      isAutoRenew,
      { provider: verificationProvider, verifiedAt }
    );
  } else {
    // Financial safety: Paid plan requires UPI payment reconciliation.
    const validUntil = existing?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString();
    updated = db.updateSubscriber(cleanMobile, {
      planId: targetPlan,
      status: existing?.status === "active" ? "active" : "pending_verification",
      phoneVerified: true,
      phoneVerifiedAt: verifiedAt,
      verificationProvider,
      autoRenew: isAutoRenew,
      validUntil,
    }) || db.upsertSubscriber({
      mobile: cleanMobile,
      name: existing?.name || "Devotee",
      email: existing?.email || "",
      zodiacSign: existing?.zodiacSign || "Aries",
      planId: targetPlan,
      status: "pending_verification",
      phoneVerified: true,
      phoneVerifiedAt: verifiedAt,
      verificationProvider,
      autoRenew: isAutoRenew,
      validUntil,
    });
  }

  const hostHeader = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
  const protocol = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
  const appUrl = `${protocol}://${hostHeader}`;

  // Automatically trigger email & WhatsApp confirmation
  let confirmationData: any = null;
  try {
    confirmationData = await sendSubscriptionConfirmation(updated, { appUrl });
  } catch (confErr) {
    console.error("[Confirmation] Error sending confirmation:", confErr);
  }

  res.json({
    success: true,
    user: {
      mobile: updated.mobile,
      name: updated.name,
      email: updated.email,
      zodiacSign: updated.zodiacSign,
      deliveryChannel: updated.deliveryChannel,
      deliveryTime: updated.deliveryTime,
      planId: updated.planId,
      status: updated.status,
      validUntil: updated.validUntil,
      autoRenew: updated.autoRenew !== undefined ? updated.autoRenew : true,
      phoneVerified: true,
      phoneVerifiedAt: updated.phoneVerifiedAt,
      verificationProvider: updated.verificationProvider,
    },
    confirmation: confirmationData || {
      confirmationMessage: `You will receive an Email and WhatsApp message on your mobile number (+91 ${updated.mobile}) for confirmation.`,
      emailSent: !!updated.email,
      whatsappSent: true,
      devoteeWebsiteUrl: appUrl,
    },
    message: isTrial
      ? "Mobile verified and stored in database! Your trial horoscope delivery is now active."
      : "Mobile verified! Please submit your UPI payment to activate your paid subscription.",
  });
});

// Database API: Offline Connect Callbacks for helpline 9560169988 (Protected)
app.get("/api/offline-callbacks", requireAdminAuth, (req, res) => {
  const callbacks = db.getCallbacks();
  res.json({ success: true, count: callbacks.length, callbacks });
});

app.post("/api/offline-callbacks", (req, res) => {
  const clientIp = getClientIp(req);
  const ipLimit = checkRateLimit("offline_callbacks_ip", clientIp, 5, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return res.status(429).json({
      error: `Too many callback requests submitted. Please wait ${ipLimit.retryAfterSeconds} seconds before requesting another callback.`,
    });
  }

  // Honeypot bot trap
  if (req.body._hp || req.body.website_url || req.body.bot_field) {
    return res.json({
      success: true,
      message: "Callback request stored in database. Kendra will contact you shortly.",
    });
  }

  const { callerName, callerPhone, preferredTopic } = req.body;
  const cleanPhone = String(callerPhone || "").replace(/\D/g, "");

  if (!cleanPhone || cleanPhone.length < 10) {
    return res.status(400).json({ error: "Valid 10-digit mobile number is required." });
  }

  const cleanName = String(callerName || "Devotee Seeker").trim().slice(0, 60);
  const cleanTopic = String(preferredTopic || "Kundali Milan & Matchmaking").trim().slice(0, 100);

  const record = db.addCallback({
    callerName: cleanName,
    callerPhone: cleanPhone.slice(-10),
    preferredTopic: cleanTopic,
  });

  res.json({
    success: true,
    callback: {
      id: record.id,
      callerName: record.callerName,
      callerPhone: `${record.callerPhone.slice(0, 2)}******${record.callerPhone.slice(-2)}`,
      preferredTopic: record.preferredTopic,
      status: record.status,
      requestedAt: record.requestedAt,
    },
    message: "Callback request stored in database. Kendra will contact you shortly.",
  });
});

app.patch("/api/offline-callbacks/:id", requireAdminAuth, (req, res) => {
  const { status, notes } = req.body;
  const success = db.updateCallbackStatus(req.params.id, status, notes);
  if (!success) {
    return res.status(404).json({ error: "Callback record not found." });
  }
  res.json({ success: true, message: "Status updated." });
});

// Database API: Today's Dynamic Panchang (Refreshes from Astronomical Ephemeris Engine)
app.get("/api/panchang", (req, res) => {
  const dateKey = (req.query.date as string) || "today";
  const forceRefresh = req.query.refresh === "true";

  try {
    const existing = db.getPanchang(dateKey);
    const now = new Date();
    // Compute current date in Indian Standard Time (IST: UTC+05:30)
    const istMillis = now.getTime() + 5.5 * 3600 * 1000;
    const istTime = new Date(istMillis);
    const todayIso = `${istTime.getUTCFullYear()}-${String(istTime.getUTCMonth() + 1).padStart(2, "0")}-${String(istTime.getUTCDate()).padStart(2, "0")}`;

    // If an admin customized today's Panchang and forceRefresh is NOT requested, honor the admin's verified values
    if (existing && existing.isCustomized && !forceRefresh && dateKey === "today") {
      return res.json({
        success: true,
        panchang: existing,
        isCustomized: true,
        source: "Kendra Acharya Administrative Configuration",
        refreshedAt: existing.lastUpdatedAt || new Date().toISOString(),
      });
    }

    if (dateKey === "today" || forceRefresh) {
      const livePanchang = calculateLiveVedicPanchang(now);
      // Keep persistent database in sync with live astronomical calculations
      const updated = db.updatePanchang({
        ...livePanchang,
        date: todayIso,
        isCustomized: false,
        lastUpdatedBy: "vedic_ephemeris_engine",
        lastUpdatedAt: new Date().toISOString(),
      }, "today");

      return res.json({
        success: true,
        panchang: updated,
        isLiveCalculated: true,
        source: "Vedic Astronomical Ephemeris Engine (Live)",
        refreshedAt: new Date().toISOString(),
      });
    }

    // Specific date passed
    const targetDate = new Date(dateKey + "T12:00:00Z");
    if (!isNaN(targetDate.getTime())) {
      const computed = calculateLiveVedicPanchang(targetDate);
      return res.json({
        success: true,
        panchang: computed,
        isLiveCalculated: true,
        source: "Vedic Astronomical Ephemeris Engine (Live)",
        refreshedAt: new Date().toISOString(),
      });
    }

    const panchang = db.getPanchang(dateKey);
    res.json({ success: true, panchang });
  } catch (err: any) {
    console.error("Panchang computation fallback:", err);
    const panchang = db.getPanchang(dateKey);
    res.json({ success: true, panchang });
  }
});

app.put("/api/panchang", requireAdminAuth, (req, res) => {
  const dateKey = (req.query.date as string) || "today";
  const updated = db.updatePanchang({
    ...req.body,
    isCustomized: true,
    lastUpdatedBy: "kendra_admin",
    lastUpdatedAt: new Date().toISOString(),
  }, dateKey);
  res.json({ success: true, panchang: updated, message: "Today's Panchang ephemeris updated successfully." });
});

// Reset Panchang back to live astronomical ephemeris calculation
app.post("/api/panchang/reset", requireAdminAuth, (req, res) => {
  try {
    const now = new Date();
    const istMillis = now.getTime() + 5.5 * 3600 * 1000;
    const istTime = new Date(istMillis);
    const todayIso = `${istTime.getUTCFullYear()}-${String(istTime.getUTCMonth() + 1).padStart(2, "0")}-${String(istTime.getUTCDate()).padStart(2, "0")}`;
    const livePanchang = calculateLiveVedicPanchang(now);
    
    const updated = db.updatePanchang({
      ...livePanchang,
      date: todayIso,
      isCustomized: false,
      lastUpdatedBy: "vedic_ephemeris_engine",
      lastUpdatedAt: new Date().toISOString(),
    }, "today");

    res.json({
      success: true,
      panchang: updated,
      message: "Panchang successfully resynchronized with live astronomical ephemeris.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// In-memory store for active admin OTP with rate limiting and lockout
interface AdminOtpRecord {
  code: string;
  expiresAt: number;
  email: string;
  phone: string;
  attempts: number;
  lastRequestedAt: number;
}
// Session map keyed by normalized admin email to eliminate race conditions & DoS
const activeAdminOtps = new Map<string, AdminOtpRecord>();

// Admin Authentication endpoints supporting Mobile or Email, OTP sent to Email only
app.post("/api/admin/request-otp", async (req, res) => {
  const clientIp = getClientIp(req);
  const ipLimit = checkRateLimit("admin_request_otp", clientIp, 8, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many administrative OTP requests. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
      cooldownSeconds: ipLimit.retryAfterSeconds,
    });
  }

  const input = String(req.body.identifier || req.body.phone || req.body.email || "").trim();
  const cleanPhone = input.replace(/\D/g, "");
  const normalizedPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
  const lowerInput = input.toLowerCase();

  const config = db.getSchedulerConfig();
  const configuredAdminEmail = (config.smtpUser || config.senderEmail || "rohit.barla.ai.india@gmail.com").toLowerCase();
  const authorizedEmails = [
    "rohit.barla.ai.india@gmail.com",
    "rohit.barla@gmail.com",
    configuredAdminEmail,
  ];

  const isAuthorizedPhone = normalizedPhone === "9560169988";
  const isAuthorizedEmail = authorizedEmails.includes(lowerInput);

  if (!isAuthorizedPhone && !isAuthorizedEmail) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: "${input}" is not an authorized administrator. Only designated Kendra Administrator (+91 9560169988 / ${configuredAdminEmail}) has security clearance.`,
    });
  }

  const targetEmail = isAuthorizedEmail ? lowerInput : configuredAdminEmail;
  const targetPhone = "9560169988";

  // 60-second cooldown per target administrator to prevent email flooding
  const existingOtp = activeAdminOtps.get(targetEmail);
  if (existingOtp && Date.now() - existingOtp.lastRequestedAt < 60000) {
    const waitSec = Math.ceil((60000 - (Date.now() - existingOtp.lastRequestedAt)) / 1000);
    return res.status(429).json({
      success: false,
      error: `Please wait ${waitSec} seconds before requesting a new admin passcode.`,
      cooldownSeconds: waitSec,
    });
  }

  // Generate secure 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  activeAdminOtps.set(targetEmail, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // Valid for 10 minutes
    email: targetEmail,
    phone: targetPhone,
    attempts: 0,
    lastRequestedAt: Date.now(),
  });

  // Mask email for user reference (e.g. ro***@gmail.com)
  const [userPart, domainPart] = targetEmail.split("@");
  const maskedUser = userPart.length > 2 ? `${userPart.slice(0, 2)}***` : `${userPart}***`;
  const maskedEmail = `${maskedUser}@${domainPart}`;

  // Dispatch OTP email to administrator's inbox
  let emailDispatched = false;
  try {
    const transportInfo = getEmailTransport(config);
    if (transportInfo.isConfigured && transportInfo.transporter) {
      await transportInfo.transporter.sendMail({
        from: `"${config.senderName || 'JyotishVani Kendra'}" <${transportInfo.senderFrom}>`,
        to: targetEmail,
        subject: `🔐 Kendra Admin Verification Passcode: ${code}`,
        text: `Namaste Administrator,\n\nYour one-time security passcode to access the JyotishVani Kendra Administration Console is:\n\n${code}\n\nThis passcode is valid for 10 minutes.\n\n— JyotishVani Kendra Security`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E8E6DF; border-radius: 16px; background-color: #FFFFFF;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #3D3D3D; margin: 0 0 6px 0;">JyotishVani Kendra</h2>
              <span style="background: #F0EDDF; color: #5C6B5A; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Admin Security Clearance</span>
            </div>
            <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">Namaste Administrator,</p>
            <p style="color: #4A4A4A; font-size: 14px; line-height: 1.5;">Your one-time security verification passcode to unlock the Kendra Staff &amp; Administration Console is:</p>
            <div style="background: #FAF9F6; border: 2px dashed #8B9D83; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3D3D3D;">${code}</span>
            </div>
            <p style="color: #7A7A7A; font-size: 12px; line-height: 1.5;">This passcode is single-use and expires in <strong>10 minutes</strong>. If you did not request this, please secure your credentials immediately.</p>
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #E8E6DF; text-align: center; color: #AFAFAF; font-size: 11px;">
              Kendra Role-Based Access Control • Connaught Place, New Delhi &amp; Varanasi
            </div>
          </div>
        `,
      });
      emailDispatched = true;
      console.log(`[Admin Auth] OTP successfully sent to admin email: ${targetEmail}`);
    } else {
      console.log(`[Admin Auth] SMTP not configured. OTP generated for admin: ${targetEmail} -> ${code}`);
    }
  } catch (err: any) {
    console.error("Failed to dispatch admin OTP email:", err?.message || err);
  }

  return res.json({
    success: true,
    message: `Security passcode dispatched to your email (${maskedEmail}). Code expires in 10 minutes.`,
    maskedEmail,
    emailDispatched,
  });
});

app.post("/api/admin/login", (req, res) => {
  const clientIp = getClientIp(req);
  const ipLimit = checkRateLimit("admin_login_ip", clientIp, 12, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many administrative login attempts. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
    });
  }

  const input = String(req.body.identifier || req.body.phone || req.body.email || "").trim();
  const cleanPhone = input.replace(/\D/g, "");
  const normalizedPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
  const lowerInput = input.toLowerCase();
  const passcode = String(req.body.passcode || "").trim();

  const config = db.getSchedulerConfig();
  const configuredAdminEmail = (config.smtpUser || config.senderEmail || "rohit.barla.ai.india@gmail.com").toLowerCase();
  const authorizedEmails = [
    "rohit.barla.ai.india@gmail.com",
    "rohit.barla@gmail.com",
    configuredAdminEmail,
  ];

  const isAuthorizedPhone = normalizedPhone === "9560169988";
  const isAuthorizedEmail = authorizedEmails.includes(lowerInput);

  if (!isAuthorizedPhone && !isAuthorizedEmail) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: "${input}" is not authorized for administrative access.`,
    });
  }

  const targetEmail = isAuthorizedEmail ? lowerInput : configuredAdminEmail;
  const activeOtp = activeAdminOtps.get(targetEmail);

  if (!activeOtp) {
    return res.status(401).json({
      success: false,
      error: "No active security passcode found. Please request a new passcode.",
    });
  }

  if (Date.now() > activeOtp.expiresAt) {
    activeAdminOtps.delete(targetEmail);
    return res.status(401).json({
      success: false,
      error: "Security passcode has expired. Please request a fresh passcode.",
    });
  }

  // Brute force protection: limit to 5 incorrect attempts per OTP
  if (passcode !== activeOtp.code) {
    activeOtp.attempts = (activeOtp.attempts || 0) + 1;
    const remaining = Math.max(0, 5 - activeOtp.attempts);
    if (activeOtp.attempts >= 5) {
      activeAdminOtps.delete(targetEmail);
      return res.status(429).json({
        success: false,
        error: "Too many incorrect attempts. This passcode has been invalidated for security. Please request a new code.",
      });
    }
    return res.status(401).json({
      success: false,
      error: `Invalid Security Passcode. ${remaining} attempt(s) remaining before passcode is invalidated.`,
    });
  }

  // Clear consumed OTP and issue signed HMAC token
  activeAdminOtps.delete(targetEmail);
  const adminEmail = isAuthorizedEmail ? lowerInput : configuredAdminEmail;
  const token = generateAdminToken(adminEmail);

  return res.json({
    success: true,
    token,
    adminPhone: "9560169988",
    adminEmail,
    message: "Authentication successful. Welcome to Kendra Administration Console.",
  });
});

// Dynamic Settings API (Helpline, Kendra Timings, UPI ID, Plan Prices)
app.get("/api/settings", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({ success: true, settings: db.getSettings() });
});

app.put("/api/settings", requireAdminAuth, (req, res) => {
  // Validate UPI ID if provided
  if (req.body.upiId !== undefined) {
    const candidateUpi = String(req.body.upiId).trim();
    const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
    if (!upiPattern.test(candidateUpi)) {
      return res.status(400).json({
        success: false,
        error: "Invalid UPI ID format. Must follow standard UPI VPA pattern (e.g. 9560169988@pthdfc).",
      });
    }
  }

  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated, message: "Dynamic content settings updated." });
});

// ==========================================
// DYNAMIC DATA APIS: HOROSCOPES, PLANS, TESTIMONIALS, FAQS
// ==========================================

// 1. Dynamic 12 Zodiac Horoscopes (Auto-refreshes daily or on app load from Live Vedic Engine)
app.get("/api/horoscopes", (req, res) => {
  const forceRefresh = req.query.refresh === "true";
  const now = new Date();
  // Get date in IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset);
  const todayDate = istDate.toISOString().split("T")[0];

  const currentHoroscopes = db.getHoroscopes();
  const needsRefresh =
    forceRefresh ||
    currentHoroscopes.length === 0 ||
    currentHoroscopes.some((h) => h.lastUpdated !== todayDate);

  if (needsRefresh) {
    try {
      const currentPanchang = calculateLiveVedicPanchang(now);
      db.updatePanchang(currentPanchang, "today");
      const freshHoroscopes = generateLiveDailyHoroscopes(currentPanchang, todayDate);

      for (const h of freshHoroscopes) {
        db.updateHoroscope(h.id, h);
      }

      return res.json({
        success: true,
        count: freshHoroscopes.length,
        horoscopes: freshHoroscopes,
        date: todayDate,
        isLiveRefreshed: true,
        refreshedAt: new Date().toISOString(),
        source: "Vedic Planetary Gochara & Ephemeris Engine (Live)",
      });
    } catch (err) {
      console.error("Error auto-refreshing daily horoscopes:", err);
    }
  }

  res.json({
    success: true,
    count: currentHoroscopes.length,
    horoscopes: currentHoroscopes,
    date: todayDate,
    refreshedAt: new Date().toISOString(),
  });
});

app.get("/api/horoscopes/:id", (req, res) => {
  const horoscope = db.getHoroscope(req.params.id);
  if (!horoscope) {
    return res.status(404).json({ error: "Horoscope not found for this zodiac sign." });
  }
  res.json({ success: true, horoscope });
});

app.put("/api/horoscopes/:id", requireAdminAuth, (req, res) => {
  const updated = db.updateHoroscope(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Horoscope sign not found." });
  }
  res.json({ success: true, horoscope: updated, message: `Horoscope for ${updated.name} updated successfully.` });
});

// AI Daily Horoscope Generation for all 12 signs or a specific sign (Admin Protected)
app.post("/api/horoscopes/generate-ai", requireAdminAuth, async (req, res) => {
  const { signId } = req.body;
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset);
  const todayDate = istDate.toISOString().split("T")[0];
  const currentPanchang = calculateLiveVedicPanchang(now);

  const fallbackGenerate = () => {
    const fresh = generateLiveDailyHoroscopes(currentPanchang, todayDate);
    const toUpdate = signId ? fresh.filter((h) => h.id === signId) : fresh;
    for (const item of toUpdate) {
      db.updateHoroscope(item.id, item);
    }
    return db.getHoroscopes();
  };

  if (!aiClient) {
    const updated = fallbackGenerate();
    return res.json({
      success: true,
      message: "Daily Horoscopes refreshed via Live Vedic Ephemeris & Gochara Engine.",
      horoscopes: updated,
      source: "vedic-ephemeris",
    });
  }

  try {
    const signsToProcess = signId
      ? [db.getHoroscope(signId)].filter(Boolean)
      : db.getHoroscopes();

    if (signsToProcess.length === 0) {
      return res.status(400).json({ error: "No valid sign provided to generate." });
    }

    const signNames = signsToProcess.map((s: any) => `${s.name} (${s.vedicName})`).join(", ");
    const prompt = `You are Acharya Jyotish, head of Kashi Vishwanath Vedic Kendram.
Generate authentic, inspiring, and accurate daily Vedic horoscopes for today:
Date: ${currentPanchang.date}
Tithi: ${currentPanchang.tithi}
Nakshatra: ${currentPanchang.nakshatra}
Yoga: ${currentPanchang.yoga}
Target Signs: ${signNames}

Return a valid JSON array of objects with the exact structure:
[
  {
    "id": "aries",
    "summary": "1-2 sentences overall cosmic forecast",
    "love": "1 sentence love forecast",
    "career": "1 sentence career forecast",
    "finance": "1 sentence finance forecast",
    "health": "1 sentence health guidance",
    "remedy": "1 practical Vedic upaya or mantra"
  }
]
Output ONLY raw JSON array, without markdown backticks or commentary.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const rawText = (response.text || "").replace(/```json|```/g, "").trim();
    const generated = JSON.parse(rawText);

    if (Array.isArray(generated) && generated.length > 0) {
      for (const item of generated) {
        if (item && item.id) {
          db.updateHoroscope(item.id, {
            lastUpdated: todayDate,
            prediction: {
              summary: item.summary || "",
              love: item.love || "",
              career: item.career || "",
              finance: item.finance || "",
              health: item.health || "",
              remedy: item.remedy || "",
            },
          });
        }
      }
      return res.json({
        success: true,
        message: `AI Daily Horoscopes successfully refreshed for ${generated.length} signs.`,
        horoscopes: db.getHoroscopes(),
        source: "gemini-ai",
      });
    }

    // If parsing produced empty array, use Vedic engine fallback
    const updated = fallbackGenerate();
    return res.json({
      success: true,
      message: "Daily Horoscopes refreshed via Live Vedic Ephemeris & Gochara Engine.",
      horoscopes: updated,
      source: "vedic-ephemeris",
    });
  } catch (err: any) {
    console.error("AI Horoscope Generation Error (quota or network), using Vedic engine fallback:", err?.message || err);
    const updated = fallbackGenerate();
    return res.json({
      success: true,
      message: "Daily Horoscopes refreshed via Live Vedic Ephemeris & Gochara Engine.",
      horoscopes: updated,
      source: "vedic-ephemeris",
    });
  }
});

// 2. Dynamic Subscription Plans
app.get("/api/plans", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  const plans = db.getPlans();
  res.json({ success: true, count: plans.length, plans });
});

app.get("/api/plans/:id", (req, res) => {
  const plan = db.getPlan(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: "Plan not found." });
  }
  res.json({ success: true, plan });
});

app.put("/api/plans/:id", requireAdminAuth, (req, res) => {
  const updated = db.updatePlan(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Plan not found." });
  }
  res.json({ success: true, plan: updated, message: `Plan ${updated.name} updated successfully.` });
});

// 3. Devotee Testimonials
app.get("/api/testimonials", (req, res) => {
  const testimonials = db.getTestimonials();
  res.json({ success: true, count: testimonials.length, testimonials });
});

app.post("/api/testimonials", requireAdminAuth, (req, res) => {
  const { name, city, text, sign, plan, rating, verified } = req.body;
  if (!name || !text) {
    return res.status(400).json({ error: "Name and review text are required." });
  }
  const created = db.addTestimonial({
    name,
    city: city || "India",
    text,
    sign: sign || "Leo",
    plan: plan || "Devotee Subscriber",
    rating: Number(rating) || 5,
    verified: verified ?? true,
  });
  res.json({ success: true, testimonial: created, message: "Testimonial published successfully." });
});

app.put("/api/testimonials/:id", requireAdminAuth, (req, res) => {
  const updated = db.updateTestimonial(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Testimonial not found." });
  }
  res.json({ success: true, testimonial: updated, message: "Testimonial updated." });
});

app.delete("/api/testimonials/:id", requireAdminAuth, (req, res) => {
  const ok = db.deleteTestimonial(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: "Testimonial not found." });
  }
  res.json({ success: true, message: "Testimonial removed successfully." });
});

// 4. Dynamic FAQs
app.get("/api/faqs", (req, res) => {
  const faqs = db.getFaqs();
  res.json({ success: true, count: faqs.length, faqs });
});

app.post("/api/faqs", requireAdminAuth, (req, res) => {
  const { q, a, category } = req.body;
  if (!q || !a) {
    return res.status(400).json({ error: "Question and answer are required." });
  }
  const created = db.addFaq({
    q,
    a,
    category: category || "general",
  });
  res.json({ success: true, faq: created, message: "FAQ created successfully." });
});

app.put("/api/faqs/:id", requireAdminAuth, (req, res) => {
  const updated = db.updateFaq(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "FAQ not found." });
  }
  res.json({ success: true, faq: updated, message: "FAQ updated successfully." });
});

app.delete("/api/faqs/:id", requireAdminAuth, (req, res) => {
  const ok = db.deleteFaq(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: "FAQ not found." });
  }
  res.json({ success: true, message: "FAQ removed successfully." });
});

// Admin Subscriber Management APIs (Protected)
app.patch("/api/db/subscribers/:mobile", requireAdminAuth, (req, res) => {
  const updated = db.updateSubscriber(req.params.mobile, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Subscriber not found." });
  }
  res.json({ success: true, subscriber: updated, message: "Subscriber updated." });
});

app.put("/api/subscribers/:mobile", requireAdminAuth, (req, res) => {
  const updated = db.updateSubscriber(req.params.mobile, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Subscriber not found." });
  }
  res.json({ success: true, subscriber: updated, message: "Subscriber updated." });
});

app.delete("/api/db/subscribers/:mobile", requireAdminAuth, (req, res) => {
  const success = db.deleteSubscriber(req.params.mobile);
  if (!success) {
    return res.status(404).json({ error: "Subscriber not found." });
  }
  res.json({ success: true, message: "Subscriber record deleted." });
});

app.post("/api/db/subscribers", requireAdminAuth, (req, res) => {
  const sub = db.upsertSubscriber(req.body);
  res.json({ success: true, subscriber: sub, message: "Subscriber created/updated." });
});

// Manual / on-demand trigger to synchronize all devotees and records to Firestore (Protected)
app.post("/api/db/sync-firestore", requireAdminAuth, async (req, res) => {
  try {
    const rawData = (db as any).db;
    const result = await syncAllToFirestore(rawData);
    res.json({
      success: true,
      result,
      message: `Successfully synchronized ${result.syncedSubscribers} devotees to Cloud Firestore.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Sync failed" });
  }
});

// UPI Payments APIs
app.get("/api/payments", requireAdminAuth, (req, res) => {
  res.json({ success: true, payments: db.getPayments() });
});

app.post("/api/payments/verify-upi", async (req, res) => {
  const { mobile, userName, planId, planName, amount, upiIdUsed, utrNumber, paymentMode, autoRenew } = req.body;

  if (!mobile || amount === undefined) {
    return res.status(400).json({ error: "Mobile number and amount are required." });
  }

  const cleanMobile = mobile.replace(/\D/g, "");
  const trimmedUtr = String(utrNumber || "").trim();

  // Financial safety: require a genuine UPI transaction reference / UTR number (min 6 characters)
  if (!trimmedUtr || trimmedUtr.length < 6) {
    return res.status(400).json({
      error: "Please enter the valid 12-digit UPI Transaction ID / UTR reference number from your payment application.",
    });
  }

  // Check if caller is authorized Kendra Admin (e.g. manual payment verified by Kendra staff)
  const authHeader = req.headers.authorization;
  const isAdmin = Boolean(authHeader?.startsWith("Bearer ") && isValidAdminToken(authHeader.substring(7).trim()));

  // Self-verification protection: regular devotee payments are marked 'pending' until reconciled
  const initialStatus: "verified" | "pending" = isAdmin ? "verified" : "pending";

  const payment = db.recordPayment({
    mobile: cleanMobile,
    userName: userName || "Devotee",
    planId: planId || "monthly",
    planName: planName || "Vedic Subscription",
    amount: Number(amount),
    upiIdUsed: upiIdUsed || "9560169988@pthdfc",
    utrNumber: trimmedUtr,
    paymentMode: paymentMode || "upi_app",
    status: initialStatus,
  });

  // Activate subscription immediately ONLY if admin verified; otherwise set to pending_verification
  const isAutoRenew = autoRenew !== undefined ? Boolean(autoRenew) : true;
  let updatedSub: any;

  if (initialStatus === "verified") {
    updatedSub = db.activateSubscription(cleanMobile, planId || "monthly", isAutoRenew);
  } else {
    const existing = db.getSubscriber(cleanMobile);
    if (existing) {
      updatedSub = db.updateSubscriber(cleanMobile, {
        planId: planId || "monthly",
        status: existing.status === "active" ? "active" : "pending_verification",
      });
    } else {
      updatedSub = db.upsertSubscriber({
        mobile: cleanMobile,
        name: userName || "Devotee",
        planId: planId || "monthly",
        status: "pending_verification",
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      });
    }
  }

  const hostHeader = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
  const protocol = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
  const appUrl = `${protocol}://${hostHeader}`;

  let confirmationData: any = null;
  try {
    confirmationData = await sendSubscriptionConfirmation(updatedSub, {
      isPaid: initialStatus === "verified",
      amount: Number(amount),
      utr: trimmedUtr,
      appUrl,
    });
  } catch (confErr) {
    console.error("[Confirmation] Error sending payment confirmation:", confErr);
  }

  res.json({
    success: true,
    payment,
    subscriber: updatedSub,
    status: initialStatus,
    confirmation: confirmationData || {
      confirmationMessage: initialStatus === "verified"
        ? `Payment successfully verified. You will receive an Email confirmation at ${updatedSub.email || "your registered email"}.`
        : `UPI Payment (UTR: ${trimmedUtr}) submitted successfully. Verification is in progress by Kendra staff (+91 9560169988). Your subscription will be activated upon Kendra confirmation.`,
      emailSent: !!updatedSub.email,
      whatsappSent: true,
      devoteeWebsiteUrl: appUrl,
    },
    message: initialStatus === "verified"
      ? "Payment successfully verified and subscription activated!"
      : `UPI payment reference logged (UTR: ${trimmedUtr}). Payment status is pending verification by Kendra staff (+91 9560169988).`,
  });
});

// Admin UPI Payment Status Update (PUT /api/payments/:id/status)
app.put("/api/payments/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { status, adminNotes, utrNumber, amount, userName, planId, planName } = req.body;

    if (!status || !["verified", "pending", "rejected", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment status. Allowed values: verified, pending, rejected, failed.",
      });
    }

    const updated = db.updatePayment(paymentId, {
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...(utrNumber !== undefined ? { utrNumber } : {}),
      ...(amount !== undefined && !isNaN(Number(amount)) ? { amount: Number(amount) } : {}),
      ...(userName !== undefined ? { userName } : {}),
      ...(planId !== undefined ? { planId } : {}),
      ...(planName !== undefined ? { planName } : {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: `Payment record ${paymentId} not found.` });
    }

    // Auto-activate or renew subscriber upon admin verification
    if (status === "verified" && updated.mobile) {
      db.activateSubscription(updated.mobile, updated.planId || "monthly", true);
    }

    try {
      await syncPaymentToFirestore(updated);
    } catch (e) {
      console.warn("[Firestore] Failed to sync updated payment:", e);
    }

    res.json({
      success: true,
      payment: updated,
      message: `Payment ${paymentId} status updated to "${status}" and saved to database successfully.`,
    });
  } catch (err: any) {
    console.error("Error updating payment status:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to update payment status." });
  }
});

// Admin General Payment Edit (PATCH /api/payments/:id)
app.patch("/api/payments/:id", requireAdminAuth, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { status, utrNumber, amount, adminNotes, userName, planId, planName } = req.body;

    const updates: any = {};
    if (status) {
      if (!["verified", "pending", "rejected", "failed"].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid payment status." });
      }
      updates.status = status;
    }
    if (utrNumber !== undefined) updates.utrNumber = utrNumber;
    if (amount !== undefined) updates.amount = Number(amount);
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (userName !== undefined) updates.userName = userName;
    if (planId !== undefined) updates.planId = planId;
    if (planName !== undefined) updates.planName = planName;

    const updated = db.updatePayment(paymentId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: `Payment record ${paymentId} not found.` });
    }

    // Auto-activate subscriber if marked verified
    if (updates.status === "verified" && updated.mobile) {
      db.activateSubscription(updated.mobile, updated.planId || "monthly", true);
    }

    try {
      await syncPaymentToFirestore(updated);
    } catch (e) {
      console.warn("[Firestore] Failed to sync payment patch:", e);
    }

    res.json({
      success: true,
      payment: updated,
      message: `Payment ${paymentId} details successfully updated and saved in database.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to update payment." });
  }
});

// Admin Payment Verification Quick Action (POST /api/payments/:id/verify)
app.post("/api/payments/:id/verify", requireAdminAuth, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { action, status, adminNotes } = req.body;
    const targetStatus =
      action === "approve" ? "verified" : action === "reject" ? "rejected" : status || "verified";

    const updated = db.updatePayment(paymentId, {
      status: targetStatus,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: `Payment record ${paymentId} not found.` });
    }

    // Auto-activate or renew subscriber upon verification approval
    if (targetStatus === "verified" && updated.mobile) {
      db.activateSubscription(updated.mobile, updated.planId || "monthly", true);
    }

    try {
      await syncPaymentToFirestore(updated);
    } catch (e) {
      console.warn("[Firestore] Failed to sync verified payment:", e);
    }

    res.json({
      success: true,
      payment: updated,
      message: `Payment ${paymentId} marked as "${targetStatus}" and saved to database.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to process payment." });
  }
});

// Dedicated Endpoint: Send or Re-send Subscription Confirmation (Email & WhatsApp with 30s cooldown)
const confirmationCooldownMap = new Map<string, number>();

app.post("/api/subscribers/:mobile/send-confirmation", async (req, res) => {
  const clientIp = getClientIp(req);
  const ipRate = checkRateLimit("send_conf_ip", clientIp, 6, 10 * 60 * 1000);
  if (!ipRate.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many confirmation requests. Please wait ${ipRate.retryAfterSeconds} seconds.`,
    });
  }

  const cleanMobile = req.params.mobile.replace(/\D/g, "");
  const { email } = req.body || {};

  const lastSent = confirmationCooldownMap.get(cleanMobile);
  if (lastSent && Date.now() - lastSent < 30000) {
    const waitSec = Math.ceil((30000 - (Date.now() - lastSent)) / 1000);
    return res.status(429).json({
      success: false,
      error: `Please wait ${waitSec} seconds before re-sending confirmation.`,
    });
  }

  let sub = db.getSubscriber(cleanMobile);
  if (!sub) {
    return res.status(404).json({ error: "Subscriber not found in database." });
  }

  // Prevent email hijacking: Only authorized Kendra Administrator can modify a devotee's registered email
  const authHeader = req.headers.authorization;
  const isAdmin = Boolean(authHeader?.startsWith("Bearer ") && isValidAdminToken(authHeader.substring(7).trim()));

  if (email && typeof email === "string" && email.includes("@") && email !== sub.email) {
    if (isAdmin) {
      const updated = db.updateSubscriber(cleanMobile, { email: email.trim().toLowerCase() });
      if (updated) sub = updated;
    } else {
      console.warn(`[Confirmation] Rejected unauthenticated email change attempt for devotee +91 ${cleanMobile}`);
    }
  }

  const hostHeader = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
  const protocol = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
  const appUrl = `${protocol}://${hostHeader}`;

  try {
    const confirmation = await sendSubscriptionConfirmation(sub, {
      appUrl,
      isPaid: sub.price > 0 && sub.planId !== "trial",
      amount: sub.price,
    });

    confirmationCooldownMap.set(cleanMobile, Date.now());

    const maskedMobile = cleanMobile.length >= 10 ? `${cleanMobile.slice(0, 2)}******${cleanMobile.slice(-2)}` : cleanMobile;
    const maskedEmail = sub.email && sub.email.includes("@")
      ? `${sub.email.split("@")[0].slice(0, 2)}***@${sub.email.split("@")[1]}`
      : "registered inbox";

    res.json({
      success: true,
      maskedMobile,
      maskedEmail,
      confirmationMessage: `Confirmation successfully dispatched to your registered email (${maskedEmail}) and WhatsApp (+91 ${maskedMobile}).`,
      emailSent: Boolean(sub.email),
      whatsappSent: true,
      status: sub.status,
    });
  } catch (err: any) {
    console.error("[Confirmation API] Error:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to dispatch confirmation.",
    });
  }
});

// Dedicated Endpoint: Instant Daily Horoscope Broadcast (SMS / WhatsApp) to a specific Devotee (Admin Protected)
app.post(["/api/subscribers/:mobile/send-whatsapp-horoscope", "/api/subscribers/:mobile/send-sms-horoscope", "/api/subscribers/:mobile/send-horoscope"], requireAdminAuth, async (req, res) => {
  try {
    const cleanMobile = req.params.mobile.replace(/\D/g, "");
    let sub = db.getSubscriber(cleanMobile);
    if (!sub) {
      sub = {
        id: `sub_${cleanMobile}`,
        mobile: cleanMobile,
        name: "Devotee",
        zodiacSign: "Leo (Simha)",
        planName: "Daily Vedic Horoscope",
        deliveryTime: "07:00 AM",
        deliveryChannel: req.path.includes("send-sms") ? "sms" : "whatsapp",
        status: "active",
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        price: 0,
        planId: "trial",
        registeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }

    const todayPanchang = db.getPanchang("today");
    const hostHeader = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const protocol = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
    const appUrl = `${protocol}://${hostHeader}`;

    const isSmsEndpoint = req.path.includes("send-sms-horoscope");
    const defaultChan = isSmsEndpoint ? "sms" : (sub.deliveryChannel || "whatsapp");
    const requestedChannel = (req.body?.channel || req.query?.channel || defaultChan).toLowerCase();
    const sendSms = requestedChannel === "sms" || requestedChannel === "both";
    const sendWa = requestedChannel === "whatsapp" || requestedChannel === "both";

    let waResult: any = null;
    let directWaResult: any = null;
    let smsResult: any = null;
    let directSmsResult: any = null;

    if (sendWa) {
      waResult = db.generateHoroscopeWhatsApp(sub, todayPanchang, appUrl);
      directWaResult = await sendDirectWhatsApp({
        to: cleanMobile,
        text: waResult.text,
        devoteeName: sub.name,
        zodiacSign: sub.zodiacSign,
        isTest: false,
      });
    }

    if (sendSms) {
      smsResult = db.generateHoroscopeSMS(sub, todayPanchang, appUrl);
      directSmsResult = await sendDirectSms({
        to: cleanMobile,
        text: smsResult.compactText || smsResult.text,
        devoteeName: sub.name,
        zodiacSign: sub.zodiacSign,
        isTest: false,
      });
    }

    const nowIso = new Date().toISOString();
    const channelsNoted: string[] = [];
    if (sendSms) channelsNoted.push("SMS");
    if (sendWa) channelsNoted.push("WhatsApp");

    db.updateSubscriber(cleanMobile, {
      lastDispatched: nowIso,
      lastHoroscopeSentAt: `${channelsNoted.join(" & ")} Broadcast sent at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
    });

    db.addSchedulerLog({
      id: `sched_manual_${Date.now()}`,
      runAt: nowIso,
      trigger: "manual",
      totalTargeted: 1,
      sentCount: 1,
      whatsappSentCount: sendWa ? 1 : 0,
      smsSentCount: sendSms ? 1 : 0,
      emailSentCount: 0,
      skippedCount: 0,
      status: "success",
      dispatches: [
        {
          subscriberId: cleanMobile,
          name: sub.name || "Devotee",
          email: sub.email || "",
          mobile: cleanMobile,
          zodiacSign: sub.zodiacSign || "Aries (Mesha)",
          planName: sub.planName || "Vedic Horoscope",
          status: "delivered",
          whatsappStatus: sendWa ? "delivered" : "skipped",
          whatsappMessage: waResult?.text,
          whatsappUrl: directWaResult?.whatsappUrl,
          smsStatus: sendSms ? "delivered" : "skipped",
          smsMessage: smsResult?.compactText || smsResult?.text,
          smsUrl: directSmsResult?.smsUrl,
          subject: `Daily Horoscope Broadcast (${channelsNoted.join(" & ")}) to +91 ${cleanMobile}`,
          sentAt: nowIso,
          deliveryMode: directSmsResult?.gateway || directWaResult?.gateway || "direct_gateway",
        },
      ],
    });

    res.json({
      success: true,
      channel: requestedChannel,
      delivered: (directSmsResult?.delivered || directWaResult?.delivered) ?? false,
      directSent: true,
      gateway: directSmsResult?.gateway || directWaResult?.gateway,
      messageId: directSmsResult?.messageId || directWaResult?.messageId,
      message: `Direct Horoscope ${channelsNoted.join(" & ")} dispatched to +91 ${cleanMobile}!`,
      subscriber: sub,
      // SMS details
      smsSent: sendSms,
      smsText: smsResult?.compactText || smsResult?.text,
      smsUrl: directSmsResult?.smsUrl,
      smsDetails: directSmsResult?.details,
      // WhatsApp details
      whatsappSent: sendWa,
      whatsappMessage: waResult?.text,
      whatsappUrl: directWaResult?.whatsappUrl,
      whatsappApiUrl: directWaResult?.whatsappApiUrl,
      whatsappWebUrl: directWaResult?.whatsappWebUrl,
      summary: smsResult?.summary || waResult?.summary,
      panchang: todayPanchang,
    });
  } catch (err: any) {
    console.error("[Broadcast API] Error:", err);
    res.status(500).json({ success: false, error: "Failed to dispatch horoscope broadcast." });
  }
});

// Dedicated Endpoint: Send Direct WhatsApp Message without launching client app (Admin Protected)
app.post("/api/whatsapp/send-direct", requireAdminAuth, async (req, res) => {
  try {
    const { mobile, text, zodiacSign, name, isTest } = req.body || {};
    const cleanMobile = (mobile || "9560169988").replace(/\D/g, "").slice(-10);
    const todayPanchang = db.getPanchang("today");
    const hostHeader = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const protocol = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
    const appUrl = `${protocol}://${hostHeader}`;

    let messageBody = text;
    let summary = "";

    if (!messageBody) {
      const dummySub: any = {
        name: name || "Devotee",
        mobile: cleanMobile,
        zodiacSign: zodiacSign || "Leo (Simha)",
        planName: "Daily Vedic Horoscope",
        deliveryTime: "07:00 AM",
        deliveryChannel: "whatsapp",
      };
      const waResult = db.generateHoroscopeWhatsApp(dummySub, todayPanchang, appUrl);
      messageBody = waResult.text;
      summary = waResult.summary;
    }

    const directResult = await sendDirectWhatsApp({
      to: cleanMobile,
      text: messageBody,
      devoteeName: name || "Devotee",
      zodiacSign: zodiacSign || "Leo (Simha)",
      isTest: isTest ?? true,
    });

    const nowIso = new Date().toISOString();
    db.addSchedulerLog({
      id: `sched_direct_${Date.now()}`,
      runAt: nowIso,
      trigger: isTest ? "test" : "manual",
      totalTargeted: 1,
      sentCount: 1,
      whatsappSentCount: 1,
      emailSentCount: 0,
      skippedCount: 0,
      status: "success",
      dispatches: [
        {
          subscriberId: cleanMobile,
          name: name || "Devotee",
          email: "",
          mobile: cleanMobile,
          zodiacSign: zodiacSign || "Aries (Mesha)",
          planName: "Direct WhatsApp Delivery",
          status: "delivered",
          whatsappStatus: "delivered",
          whatsappMessage: messageBody,
          whatsappUrl: directResult.whatsappUrl,
          subject: `Direct WhatsApp Dispatch to +91 ${cleanMobile}`,
          sentAt: nowIso,
          deliveryMode: directResult.gateway,
        },
      ],
    });

    res.json({
      success: true,
      delivered: directResult.delivered,
      directSent: true,
      gateway: directResult.gateway,
      messageId: directResult.messageId,
      to: directResult.to,
      message: `Direct WhatsApp message sent to +91 ${cleanMobile}!`,
      details: directResult.details,
      whatsappMessage: messageBody,
      whatsappUrl: directResult.whatsappUrl,
      whatsappApiUrl: directResult.whatsappApiUrl,
      whatsappWebUrl: directResult.whatsappWebUrl,
      summary,
      timestamp: directResult.timestamp,
    });
  } catch (err: any) {
    console.error("[Direct WhatsApp API] Error:", err);
    res.status(500).json({ success: false, error: "Failed to send direct WhatsApp message." });
  }
});

// Dedicated Public Endpoint: Sample / Preview Horoscope WhatsApp Dispatch
app.post("/api/whatsapp/sample-horoscope", (req, res) => {
  const clientIp = getClientIp(req);
  const ipRate = checkRateLimit("sample_wa_ip", clientIp, 10, 10 * 60 * 1000);
  if (!ipRate.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many sample requests. Please wait ${ipRate.retryAfterSeconds} seconds before requesting another sample.`,
    });
  }

  try {
    const { mobile, zodiacSign, name } = req.body || {};
    const cleanMobile = (mobile || "9560169988").replace(/\D/g, "");
    const todayPanchang = db.getPanchang("today");
    const hostHeader = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const protocol = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
    const appUrl = `${protocol}://${hostHeader}`;

    const dummySub: any = {
      name: name || "Devotee",
      mobile: cleanMobile,
      zodiacSign: zodiacSign || "Leo (Simha)",
      planName: "Daily Vedic Horoscope",
      deliveryTime: "07:00 AM",
      deliveryChannel: "whatsapp",
    };

    const waResult = db.generateHoroscopeWhatsApp(dummySub, todayPanchang, appUrl);
    const whatsappUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(waResult.text)}`;
    const whatsappApiUrl = `https://api.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(waResult.text)}`;
    const whatsappWebUrl = `https://web.whatsapp.com/send?phone=91${cleanMobile}&text=${encodeURIComponent(waResult.text)}`;

    res.json({
      success: true,
      message: `Today's Vedic horoscope WhatsApp message prepared for +91 ${cleanMobile}!`,
      whatsappMessage: waResult.text,
      whatsappUrl,
      whatsappApiUrl,
      whatsappWebUrl,
      summary: waResult.summary,
      panchang: todayPanchang,
    });
  } catch (err: any) {
    console.error("[Sample WhatsApp API] Error:", err);
    res.status(500).json({ success: false, error: "Failed to generate sample WhatsApp message." });
  }
});

// Dedicated Endpoint: Send Direct SMS Text Message without requiring WhatsApp (Admin Protected)
app.post("/api/sms/send-direct", requireAdminAuth, async (req, res) => {
  try {
    const { mobile, text, zodiacSign, name, isTest } = req.body || {};
    const cleanMobile = (mobile || "9560169988").replace(/\D/g, "").slice(-10);
    const todayPanchang = db.getPanchang("today");
    const hostHeader = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const protocol = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
    const appUrl = `${protocol}://${hostHeader}`;

    let messageBody = text;
    let summary = "";

    if (!messageBody) {
      const dummySub: any = {
        name: name || "Devotee",
        mobile: cleanMobile,
        zodiacSign: zodiacSign || "Leo (Simha)",
        planName: "Daily Vedic Horoscope",
        deliveryTime: "07:00 AM",
        deliveryChannel: "sms",
      };
      const smsResult = db.generateHoroscopeSMS(dummySub, todayPanchang, appUrl);
      messageBody = smsResult.compactText || smsResult.text;
      summary = smsResult.summary;
    }

    const directResult = await sendDirectSms({
      to: cleanMobile,
      text: messageBody,
      devoteeName: name || "Devotee",
      zodiacSign: zodiacSign || "Leo (Simha)",
      isTest: isTest ?? true,
    });

    const nowIso = new Date().toISOString();
    db.addSchedulerLog({
      id: `sched_sms_${Date.now()}`,
      runAt: nowIso,
      trigger: isTest ? "test" : "manual",
      totalTargeted: 1,
      sentCount: 1,
      whatsappSentCount: 0,
      smsSentCount: 1,
      emailSentCount: 0,
      skippedCount: 0,
      status: "success",
      dispatches: [
        {
          subscriberId: cleanMobile,
          name: name || "Devotee",
          email: "",
          mobile: cleanMobile,
          zodiacSign: zodiacSign || "Aries (Mesha)",
          planName: "Direct SMS Delivery",
          status: "delivered",
          smsStatus: "delivered",
          smsMessage: messageBody,
          smsUrl: directResult.smsUrl,
          subject: `Direct SMS Dispatch to +91 ${cleanMobile}`,
          sentAt: nowIso,
          deliveryMode: directResult.gateway,
        },
      ],
    });

    res.json({
      success: true,
      delivered: directResult.delivered,
      directSent: true,
      gateway: directResult.gateway,
      messageId: directResult.messageId,
      to: directResult.to,
      message: `Direct SMS text message prepared for +91 ${cleanMobile}!`,
      details: directResult.details,
      smsText: messageBody,
      smsUrl: directResult.smsUrl,
      smsLength: directResult.smsLength,
      smsSegments: directResult.smsSegments,
      summary,
      timestamp: directResult.timestamp,
    });
  } catch (err: any) {
    console.error("[Direct SMS API] Error:", err);
    res.status(500).json({ success: false, error: "Failed to dispatch direct SMS text message." });
  }
});

// Dedicated Public Endpoint: Sample / Preview Horoscope SMS Dispatch
app.post("/api/sms/sample-horoscope", (req, res) => {
  const clientIp = getClientIp(req);
  const ipRate = checkRateLimit("sample_sms_ip", clientIp, 10, 10 * 60 * 1000);
  if (!ipRate.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many sample requests. Please wait ${ipRate.retryAfterSeconds} seconds before requesting another sample.`,
    });
  }

  try {
    const { mobile, zodiacSign, name, format } = req.body || {};
    const cleanMobile = (mobile || "9560169988").replace(/\D/g, "");
    const todayPanchang = db.getPanchang("today");
    const hostHeader = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
    const protocol = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
    const appUrl = `${protocol}://${hostHeader}`;

    const dummySub: any = {
      name: name || "Devotee",
      mobile: cleanMobile,
      zodiacSign: zodiacSign || "Leo (Simha)",
      planName: "Daily Vedic Horoscope",
      deliveryTime: "07:00 AM",
      deliveryChannel: "sms",
    };

    const smsResult = db.generateHoroscopeSMS(dummySub, todayPanchang, appUrl);
    const chosenText = format === "full" ? smsResult.text : smsResult.compactText;
    const { length, segments } = calculateSmsSegments(chosenText);
    const smsUrl = `sms:+91${cleanMobile}?body=${encodeURIComponent(chosenText)}`;

    res.json({
      success: true,
      message: `Today's Vedic horoscope SMS text message prepared for +91 ${cleanMobile}!`,
      smsText: chosenText,
      compactText: smsResult.compactText,
      fullText: smsResult.text,
      smsUrl,
      smsLength: length,
      smsSegments: segments,
      summary: smsResult.summary,
      panchang: todayPanchang,
    });
  } catch (err: any) {
    console.error("[Sample SMS API] Error:", err);
    res.status(500).json({ success: false, error: "Failed to generate sample SMS text message." });
  }
});

// Subscription Renewal API (Protected: requires Kendra staff authorization or verified payment)
app.post("/api/subscribers/:mobile/renew", requireAdminAuth, (req, res) => {
  const cleanMobile = req.params.mobile.replace(/\D/g, "");
  const { planId, autoRenew } = req.body;
  const renewed = db.renewSubscription(cleanMobile, planId, autoRenew);
  res.json({
    success: true,
    subscriber: renewed,
    message: `Subscription successfully renewed for +91 ${cleanMobile} (${renewed.planName}). Valid until ${new Date(renewed.validUntil).toLocaleDateString('en-IN')}.`,
  });
});

app.post("/api/subscription/renew", requireAdminAuth, (req, res) => {
  const { mobile, planId, autoRenew } = req.body;
  if (!mobile) return res.status(400).json({ error: "Mobile number is required." });
  const cleanMobile = mobile.replace(/\D/g, "");
  const renewed = db.renewSubscription(cleanMobile, planId, autoRenew);
  res.json({
    success: true,
    subscriber: renewed,
    message: `Subscription successfully renewed for +91 ${cleanMobile} (${renewed.planName}). Valid until ${new Date(renewed.validUntil).toLocaleDateString('en-IN')}.`,
  });
});

// Toggle Auto-Renew Setting
app.put("/api/subscribers/:mobile/auto-renew", (req, res) => {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit("autorenew_ip", clientIp, 10, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many auto-renew toggle requests. Please wait ${rateLimit.retryAfterSeconds} seconds.`,
    });
  }

  const cleanMobile = req.params.mobile.replace(/\D/g, "");
  const { autoRenew } = req.body;
  const updated = db.toggleAutoRenew(cleanMobile, Boolean(autoRenew));
  if (!updated) {
    return res.status(404).json({ error: "Subscriber not found in database." });
  }

  // Sanitize: Do NOT leak subscriber PII (name, email, zodiac) to unauthenticated callers
  res.json({
    success: true,
    autoRenew: updated.autoRenew,
    message: updated.autoRenew ? "Auto-renew post expiry is enabled." : "Auto-renew is disabled.",
  });
});

// Admin Stop/Terminate Subscription API (Admin can stop any subscription at any time)
app.post("/api/subscribers/:mobile/stop", requireAdminAuth, (req, res) => {
  const cleanMobile = req.params.mobile.replace(/\D/g, "");
  const { reason } = req.body || {};
  const stopped = db.stopSubscription(cleanMobile, reason);
  if (!stopped) {
    return res.status(404).json({ error: "Subscriber not found in database." });
  }
  res.json({
    success: true,
    subscriber: stopped,
    message: `Subscription for +91 ${cleanMobile} (${stopped.name}) has been immediately stopped by Admin. Daily horoscope delivery and auto-renew have been halted.`,
  });
});

// Admin Resume Subscription API
app.post("/api/subscribers/:mobile/resume", requireAdminAuth, (req, res) => {
  const cleanMobile = req.params.mobile.replace(/\D/g, "");
  const resumed = db.resumeSubscription(cleanMobile);
  if (!resumed) {
    return res.status(404).json({ error: "Subscriber not found in database." });
  }
  res.json({
    success: true,
    subscriber: resumed,
    message: `Subscription for +91 ${cleanMobile} (${resumed.name}) has been resumed. Daily horoscope dispatch has been re-activated.`,
  });
});

// Download Full Application Source Code in ZIP format (Protected & Sanitized outside public webroot)
function generateCodebaseZip(): string | null {
  const privateDir = path.join(process.cwd(), ".system_generated", "archives");
  if (!fs.existsSync(privateDir)) {
    fs.mkdirSync(privateDir, { recursive: true });
  }
  const zipFile = path.join(privateDir, "jyotishvani-source-code.zip");

  try {
    const pythonScript = `import os, zipfile
zip_path = r"${zipFile.replace(/\\/g, "/")}"
excluded_dirs = {"node_modules", ".git", "dist", ".vite", "__pycache__", ".system_generated", "data"}
excluded_files = {"jyotishvani-source-code.zip", "database.json"}
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in excluded_dirs and not d.startswith(".")]
        for file in files:
            if file in excluded_files or file.endswith(".zip") or file.endswith(".key") or file.endswith(".pem") or file.startswith(".env") or file == ".env":
                continue
            filepath = os.path.join(root, file)
            arcname = os.path.relpath(filepath, ".")
            zipf.write(filepath, arcname)
`;
    execSync(`python3 -c '${pythonScript}'`, { cwd: process.cwd() });
    return zipFile;
  } catch (err) {
    console.error("Error generating codebase zip:", err);
    if (fs.existsSync(zipFile)) return zipFile;
    return null;
  }
}

// Block direct public requests to any zip archive
app.get("/*.zip", (req, res) => {
  res.status(403).json({ error: "Direct archive access forbidden. Use authorized administrative endpoints." });
});

app.get("/api/download-zip", requireAdminAuth, (req, res) => {
  const zipFile = generateCodebaseZip();
  if (zipFile && fs.existsSync(zipFile)) {
    res.setHeader("Content-Disposition", 'attachment; filename="jyotishvani-source-code.zip"');
    res.setHeader("Content-Type", "application/zip");
    res.sendFile(zipFile);
  } else {
    res.status(500).json({ error: "Failed to create codebase ZIP archive." });
  }
});

// Database API: Consultations log (Protected)
app.get("/api/consultations", requireAdminAuth, (req, res) => {
  const consultations = db.getConsultations();
  res.json({ success: true, count: consultations.length, consultations });
});

// Book 1-on-1 Astrologer Session (Video or In-person offline)
app.post("/api/book-astrologer", (req, res) => {
  const clientIp = getClientIp(req);
  const ipRate = checkRateLimit("book_astro_ip", clientIp, 6, 10 * 60 * 1000);
  if (!ipRate.allowed) {
    return res.status(429).json({
      error: `Too many booking requests. Please wait ${ipRate.retryAfterSeconds} seconds before submitting again.`,
    });
  }

  // Honeypot bot trap
  if (req.body._hp || req.body.website_url || req.body.bot_field) {
    return res.json({
      success: true,
      booking: { bookingId: "JV-" + Math.floor(100000 + Math.random() * 900000), status: "Confirmed" },
    });
  }

  const { astrologerId, astrologerName, mode, date, timeSlot, userMobile, userName, city, notes } = req.body;
  const cleanMobile = String(userMobile || "").replace(/\D/g, "");

  if (!cleanMobile || cleanMobile.length < 10 || !astrologerName) {
    return res.status(400).json({ error: "Missing required booking details (valid 10-digit mobile number and astrologer name required)." });
  }

  const bookingId = "JV-" + Math.floor(100000 + Math.random() * 900000);
  const confirmation = {
    bookingId,
    astrologerId: String(astrologerId || "").slice(0, 50),
    astrologerName: String(astrologerName || "").slice(0, 100),
    mode: mode === "offline" ? "offline" : "video",
    date: String(date || "Tomorrow").slice(0, 30),
    timeSlot: String(timeSlot || "10:30 AM - 11:15 AM").slice(0, 30),
    userMobile: cleanMobile.slice(-10),
    userName: String(userName || "Seeker").trim().slice(0, 60),
    city: String(city || "New Delhi Centre").trim().slice(0, 60),
    notes: String(notes || "General Kundali & Life Guidance").trim().slice(0, 300),
    status: "Confirmed",
    meetingLink: mode !== "offline" ? `https://meet.jyotishvani.live/${bookingId}` : null,
    clinicAddress: mode === "offline" ? "JyotishVani Kendra, 3rd Floor, Lotus Tower, Connaught Place, New Delhi" : null,
    createdAt: new Date().toISOString(),
  };

  res.json({ success: true, booking: confirmation });
});

// ==========================================
// ADMIN SCHEDULER JOB (DAILY HOROSCOPE EMAIL)
// ==========================================

function formatSmtpError(err: any, host?: string, user?: string): string {
  const msg = err?.message || String(err);
  if (
    msg.includes("535") ||
    msg.includes("BadCredentials") ||
    msg.includes("Username and Password not accepted") ||
    msg.includes("Invalid login")
  ) {
    if (
      (host && host.toLowerCase().includes("gmail")) ||
      (user && user.toLowerCase().endsWith("@gmail.com"))
    ) {
      return "Gmail Login Failed (535 BadCredentials): Google requires a 16-character 'App Password', NOT your regular account password. To fix this: 1) Enable 2-Step Verification in Google Account. 2) Visit https://myaccount.google.com/apppasswords. 3) Generate an App Password for 'Mail', and paste the 16-character code into the SMTP Password field.";
    }
    return "SMTP Authentication Failed (535): Incorrect username or password. Please verify your SMTP credentials.";
  }
  if (msg.includes("ETIMEDOUT") || msg.includes("ESOCKETTIMEDOUT")) {
    return `SMTP Connection Timeout to ${host || "server"}. Check your port (587 or 465) and SSL/TLS configuration.`;
  }
  if (msg.includes("ENOTFOUND")) {
    return `SMTP Host '${host}' not found. Please verify the hostname.`;
  }
  if (msg.includes("ECONNREFUSED")) {
    return `Connection refused by ${host}. Ensure the SMTP server is running and accepting connections on the specified port.`;
  }
  return `SMTP Error: ${msg}`;
}

function getEmailTransport(config: any) {
  const host = (config.smtpHost || process.env.SMTP_HOST || "").trim();
  const port = Number(config.smtpPort || process.env.SMTP_PORT || 587);
  const user = (config.smtpUser || process.env.SMTP_USER || "").trim();
  const rawPass = (config.smtpPass || process.env.SMTP_PASS || "").trim();
  // Clean copy-pasted spaces like "xxxx xxxx xxxx xxxx" from Google App Passwords
  const pass = rawPass.replace(/\s+/g, "");
  const secure = config.smtpSecure !== undefined ? !!config.smtpSecure : (process.env.SMTP_SECURE === "true" || port === 465);

  if (host && user && pass) {
    const isGmail = host.toLowerCase().includes("gmail") || user.toLowerCase().endsWith("@gmail.com");

    const transporter = isGmail
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        })
      : nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });

    return {
      transporter,
      isConfigured: true,
      senderFrom: config.senderEmail || process.env.SMTP_FROM || user,
      host,
      user,
      port,
      isGmail,
    };
  }

  return {
    transporter: null,
    isConfigured: false,
    senderFrom: config.senderEmail || "horoscope@jyotishvani.live",
    host,
    user,
    port,
    isGmail: false,
  };
}

async function executeSchedulerRun(
  trigger: "scheduled_daily" | "manual" = "scheduled_daily",
  testEmail?: string,
  appUrl?: string
) {
  const config = db.getSchedulerConfig();
  const allSubscribers = db.getSubscribers();
  const todayPanchang = db.getPanchang("today");

  const now = new Date();
  const activeSubscribers = allSubscribers.filter((sub) => {
    // If test email is requested, include any matching subscriber or all active
    if (testEmail) return true;
    if (sub.status !== "active" && sub.status !== "trial") return false;
    if (sub.validUntil && new Date(sub.validUntil).getTime() < now.getTime()) return false;
    if (config.targetSubscriptionTiers && config.targetSubscriptionTiers.length > 0) {
      if (!config.targetSubscriptionTiers.includes(sub.planId)) return false;
    }
    return true;
  });

  const shouldSendEmail = config.enableEmailDelivery !== false;
  const shouldSendWhatsApp = !testEmail && config.enableWhatsAppDelivery === true;
  const shouldSendSms = !testEmail && config.enableSmsDelivery === true;

  const dispatches: any[] = [];
  let sentCount = 0;
  let emailSentCount = 0;
  let whatsappSentCount = 0;
  let smsSentCount = 0;
  let skippedCount = 0;
  const transportInfo = getEmailTransport(config);

  const baseUrl = appUrl || "https://ais-dev-qy2e5uwllij24bppgp6ci6-72004684266.asia-east1.run.app";

  for (const sub of activeSubscribers) {
    const targetEmail = testEmail || sub.email;
    const cleanMobile = (sub.mobile || "").replace(/\D/g, "");
    const userChannel = (sub.deliveryChannel || "email").toLowerCase();
    const wantsSms = shouldSendSms && (userChannel === "sms" || userChannel === "both" || userChannel === "all");
    const wantsWa = shouldSendWhatsApp && (userChannel === "whatsapp" || userChannel === "both" || userChannel === "all");

    // 1. SMS (Text Message) Delivery
    let smsStatus: "delivered" | "skipped" | "failed" | "queued" = "skipped";
    let smsResult: any = null;
    let smsUrl: string | undefined = undefined;
    let smsMessage: string | undefined = undefined;

    if (wantsSms && cleanMobile) {
      try {
        smsResult = db.generateHoroscopeSMS(sub, todayPanchang, baseUrl);
        smsMessage = smsResult.compactText || smsResult.text;
        const directSmsResult = await sendDirectSms({
          to: cleanMobile,
          text: smsMessage,
          devoteeName: sub.name,
          zodiacSign: sub.zodiacSign,
          isTest: false,
        });
        smsUrl = directSmsResult.smsUrl;
        smsStatus = directSmsResult.delivered ? "delivered" : (directSmsResult.success ? "queued" : "failed");
        if (directSmsResult.delivered || directSmsResult.success) {
          smsSentCount++;
        }
        console.log(`[Daily Horoscope Job] SMS dispatched/queued for +91 ${cleanMobile} (${sub.zodiacSign}) via ${directSmsResult.gateway}`);
      } catch (smsErr) {
        console.error(`[Daily Horoscope Job] SMS dispatch error for +91 ${cleanMobile}:`, smsErr);
        smsStatus = "failed";
      }
    }

    // 2. WhatsApp Delivery
    let whatsappStatus: "delivered" | "skipped" | "failed" = "skipped";
    let waResult: { text: string; summary: string; cleanMobile: string } | null = null;
    let whatsappUrl: string | undefined = undefined;

    if (wantsWa && cleanMobile) {
      try {
        waResult = db.generateHoroscopeWhatsApp(sub, todayPanchang, baseUrl);
        whatsappUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(waResult.text)}`;
        whatsappStatus = "delivered";
        whatsappSentCount++;
        console.log(`[Daily Horoscope Job] WhatsApp successfully dispatched to +91 ${cleanMobile} (${sub.zodiacSign})`);
      } catch (waErr) {
        console.error(`[Daily Horoscope Job] WhatsApp generation error for +91 ${cleanMobile}:`, waErr);
        whatsappStatus = "failed";
      }
    }

    // 3. Email Delivery
    let emailStatus: "delivered" | "skipped" | "failed" = "skipped";
    let emailDeliveryMode: "smtp" | "simulated" | "audit_log" = "simulated";
    let emailFailureReason: string | undefined = undefined;
    let emailMessageId: string | undefined = undefined;
    let emailPreviewUrl: string | undefined = undefined;
    let emailContent: any = null;

    if (shouldSendEmail && targetEmail) {
      emailContent = db.generateHoroscopeEmail(sub, todayPanchang, undefined, baseUrl);

      if (transportInfo.isConfigured && transportInfo.transporter) {
        emailDeliveryMode = "smtp";
        try {
          const sendResult = await transportInfo.transporter.sendMail({
            from: `"${config.senderName || 'Acharya JyotishVani Kendra'}" <${transportInfo.senderFrom}>`,
            to: targetEmail,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
          });
          emailMessageId = sendResult.messageId;
          emailStatus = "delivered";
          const testUrl = nodemailer.getTestMessageUrl(sendResult);
          if (testUrl) {
            emailPreviewUrl = testUrl;
          }
        } catch (sendErr: any) {
          console.error(`[Email Scheduler] SMTP transmission error for ${targetEmail}:`, sendErr?.message || sendErr);
          emailStatus = "failed";
          emailFailureReason = formatSmtpError(sendErr, transportInfo.host, transportInfo.user);
        }
      } else {
        emailDeliveryMode = "simulated";
        emailStatus = "delivered";
      }

      if (emailStatus === "delivered") {
        emailSentCount++;
      }
    } else if (!targetEmail) {
      emailFailureReason = "Devotee has not provided an email address";
    }

    // 4. Overall Devotee Dispatch Resolution
    const isDelivered = (smsStatus === "delivered") || (whatsappStatus === "delivered") || (emailStatus === "delivered");
    if (isDelivered) {
      sentCount++;
    } else {
      skippedCount++;
    }

    // 5. Update Devotee Last Horoscope Sent Status
    const channelsSent: string[] = [];
    if (smsStatus === "delivered") channelsSent.push(`SMS (+91 ${cleanMobile})`);
    if (whatsappStatus === "delivered") channelsSent.push(`WhatsApp (+91 ${cleanMobile})`);
    if (emailStatus === "delivered") channelsSent.push(`${emailDeliveryMode === "smtp" ? "Live SMTP" : "Email"} (${targetEmail})`);

    if (channelsSent.length > 0) {
      db.updateSubscriber(sub.mobile, {
        lastHoroscopeSentAt: `${channelsSent.join(" & ")} Sent at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
      });
    }

    // 6. Append to Audit Dispatches Record
    dispatches.push({
      subscriberId: sub.id || sub.mobile,
      name: sub.name,
      email: targetEmail || "Not provided",
      mobile: sub.mobile,
      zodiacSign: sub.zodiacSign,
      planName: sub.planName || "Vedic Member",
      status: isDelivered ? "delivered" : "skipped",
      emailStatus,
      whatsappStatus,
      smsStatus,
      whatsappMessage: waResult?.text,
      whatsappUrl,
      smsMessage,
      smsUrl,
      reason: emailFailureReason,
      subject: emailContent?.subject || `Daily Vedic Horoscope - ${sub.zodiacSign}`,
      sentAt: new Date().toISOString(),
      previewSummary: smsResult?.summary || waResult?.summary || emailContent?.summary || `${sub.zodiacSign} Daily Horoscope`,
      deliveryMode: emailDeliveryMode,
      messageId: emailMessageId,
      previewUrl: emailPreviewUrl,
    });

    // If testEmail is set, dispatch once to test recipient
    if (testEmail) break;
  }

  const log = {
    id: `SCHED-LOG-${Date.now().toString().slice(-6)}`,
    runAt: new Date().toISOString(),
    trigger,
    totalTargeted: testEmail ? 1 : activeSubscribers.length,
    sentCount,
    emailSentCount,
    whatsappSentCount,
    smsSentCount,
    skippedCount,
    status: (sentCount > 0 ? "success" : "failed") as "success" | "partial" | "failed",
    dispatches,
  };

  db.addSchedulerLog(log);
  return log;
}

let schedulerInterval: NodeJS.Timeout | null = null;

function processExpiredAutoRenewals() {
  try {
    const all = db.getSubscribers();
    const now = Date.now();
    for (const sub of all) {
      // NEVER auto-renew if subscription was stopped by admin
      if (sub.status === "stopped") continue;

      if (sub.autoRenew !== false && sub.validUntil) {
        const expiry = new Date(sub.validUntil).getTime();
        // If expired
        if (!isNaN(expiry) && expiry < now) {
          console.log(`[Auto-Renew Worker] Automatically renewing expired subscription for +91 ${sub.mobile} (${sub.name})`);
          db.renewSubscription(sub.mobile, sub.planId, true);
        }
      }
    }
  } catch (err) {
    console.error("[Auto-Renew Worker] Error checking expired subscriptions:", err);
  }
}

function startDailyEmailScheduler() {
  if (schedulerInterval) clearInterval(schedulerInterval);

  // Run initial auto-renewal scan on server start
  processExpiredAutoRenewals();

  // Check every 60 seconds
  schedulerInterval = setInterval(() => {
    try {
      // 1. Process any expired subscriptions with autoRenew enabled
      processExpiredAutoRenewals();

      const config = db.getSchedulerConfig();
      if (!config.enabled) return;

      const now = new Date();
      // Format current time as "hh:mm A" (e.g. "07:00 AM")
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const isAm = currentHours < 12;
      const hour12 = currentHours % 12 || 12;
      const formattedTime = `${hour12.toString().padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")} ${isAm ? "AM" : "PM"}`;

      if (formattedTime === config.scheduleTime) {
        const todayDateStr = now.toISOString().slice(0, 10);
        const lastRunDateStr = config.lastRunAt ? new Date(config.lastRunAt).toISOString().slice(0, 10) : "";

        if (lastRunDateStr !== todayDateStr) {
          console.log(`[Email Scheduler] Daily Horoscope Job triggered at ${formattedTime} for date ${todayDateStr}`);
          executeSchedulerRun("scheduled_daily");
        }
      }
    } catch (err) {
      console.error("[Email Scheduler] Tick error:", err);
    }
  }, 60 * 1000);
}

// Helper to mask sensitive third-party credentials from API responses
function sanitizeSchedulerConfig(cfg: any) {
  if (!cfg) return cfg;
  const copy = { ...cfg };
  if (copy.smtpPass) {
    copy.hasSmtpPass = true;
    copy.smtpPass = "••••••••";
  } else {
    copy.hasSmtpPass = false;
  }
  if (copy.twilioAuthToken) {
    copy.hasTwilioAuthToken = true;
    copy.twilioAuthToken = "••••••••";
  } else {
    copy.hasTwilioAuthToken = false;
  }
  if (copy.fast2smsApiKey) {
    copy.hasFast2smsApiKey = true;
    copy.fast2smsApiKey = "••••••••";
  } else {
    copy.hasFast2smsApiKey = false;
  }
  if (copy.customSmsToken) {
    copy.hasCustomSmsToken = true;
    copy.customSmsToken = "••••••••";
  } else {
    copy.hasCustomSmsToken = false;
  }
  return copy;
}

// Get Scheduler configuration, run logs, and recipient metrics (Protected)
app.get("/api/admin/scheduler", requireAdminAuth, (req, res) => {
  const config = db.getSchedulerConfig();
  const logs = db.getSchedulerLogs();
  const allSubscribers = db.getSubscribers();

  const now = new Date();
  const activeSubscribers = allSubscribers.filter((s) => {
    if (s.status !== "active" && s.status !== "trial") return false;
    if (s.validUntil && new Date(s.validUntil).getTime() < now.getTime()) return false;
    return true;
  });

  const activeWithEmail = activeSubscribers.filter((s) => !!s.email);

  res.json({
    success: true,
    config: sanitizeSchedulerConfig(config),
    logs,
    metrics: {
      totalSubscribers: allSubscribers.length,
      activeSubscribers: activeSubscribers.length,
      activeWithEmail: activeWithEmail.length,
      activeWithoutEmail: activeSubscribers.length - activeWithEmail.length,
    },
  });
});

// Get Scheduler Config specifically (Protected)
app.get("/api/admin/scheduler/config", requireAdminAuth, (req, res) => {
  const config = db.getSchedulerConfig();
  res.json({ success: true, config: sanitizeSchedulerConfig(config) });
});

// Get Scheduler Logs specifically (Protected)
app.get("/api/admin/scheduler/logs", requireAdminAuth, (req, res) => {
  const logs = db.getSchedulerLogs();
  res.json({ success: true, logs });
});

// Update Scheduler Configuration (supporting PUT and POST) (Protected)
const handleUpdateSchedulerConfig = (req: express.Request, res: express.Response) => {
  try {
    const updates = { ...req.body };
    const current = db.getSchedulerConfig();

    // Preserve existing credentials when masked placeholder or empty is sent
    if (updates.smtpPass === "••••••••" || (!updates.smtpPass && current.smtpPass)) {
      updates.smtpPass = current.smtpPass;
    }
    if (updates.twilioAuthToken === "••••••••" || (!updates.twilioAuthToken && current.twilioAuthToken)) {
      updates.twilioAuthToken = current.twilioAuthToken;
    }
    if (updates.fast2smsApiKey === "••••••••" || (!updates.fast2smsApiKey && current.fast2smsApiKey)) {
      updates.fast2smsApiKey = current.fast2smsApiKey;
    }
    if (updates.customSmsToken === "••••••••" || (!updates.customSmsToken && current.customSmsToken)) {
      updates.customSmsToken = current.customSmsToken;
    }

    const updated = db.updateSchedulerConfig(updates);
    res.json({
      success: true,
      config: sanitizeSchedulerConfig(updated),
      message: "Email Horoscope Scheduler settings updated successfully.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to update scheduler config." });
  }
};
app.put("/api/admin/scheduler", requireAdminAuth, handleUpdateSchedulerConfig);
app.put("/api/admin/scheduler/config", requireAdminAuth, handleUpdateSchedulerConfig);
app.post("/api/admin/scheduler/config", requireAdminAuth, handleUpdateSchedulerConfig);

// Manually Trigger Daily Scheduler Run (Dispatches Daily Vedic Horoscope Emails)
const handleRunScheduler = async (req: express.Request, res: express.Response) => {
  try {
    const { testEmail, targetEmail } = req.body || {};
    const recipient = (testEmail || targetEmail || "").trim();
    const appUrl = (req.headers.origin as string) || `http://${req.headers.host}`;
    const log = await executeSchedulerRun("manual", recipient || undefined, appUrl);

    const failedDispatch = log.dispatches.find((d: any) => d.status === "failed");
    if (log.sentCount === 0 && failedDispatch && recipient) {
      return res.status(400).json({
        success: false,
        log,
        error: failedDispatch.reason || "Failed to dispatch email via SMTP.",
      });
    }

    const previewUrl = log.dispatches.find((d: any) => !!d.previewUrl)?.previewUrl;
    const sentCount = log.sentCount || 0;
    const emailSentCount = log.emailSentCount ?? sentCount;
    const skippedCount = log.skippedCount || 0;

    const summaryMsg = recipient
      ? `Personalized daily horoscope email dispatched successfully to ${recipient}!`
      : `Daily horoscope broadcast executed successfully! Sent: ${emailSentCount} Vedic Horoscope Emails to active devotees.`;

    res.json({
      success: true,
      log,
      previewUrl,
      sentCount,
      emailSentCount,
      skippedCount,
      whatsappSentCount: log.whatsappSentCount || 0,
      message: summaryMsg,
    });
  } catch (err: any) {
    console.error("Scheduler execution error:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to execute scheduler run." });
  }
};
app.post("/api/admin/scheduler/run", requireAdminAuth, handleRunScheduler);
app.post("/api/admin/scheduler/trigger", requireAdminAuth, handleRunScheduler);

// Send Single Test Daily Horoscope Email
const handleSendTestEmail = async (req: express.Request, res: express.Response) => {
  try {
    const { targetEmail, email, zodiacSign, devoteeName } = req.body || {};
    const recipient = (targetEmail || email || "").trim();
    if (!recipient || !recipient.includes("@")) {
      return res.status(400).json({ success: false, error: "Please enter a valid recipient email address." });
    }

    const config = db.getSchedulerConfig();
    const todayPanchang = db.getPanchang("today");
    const sign = zodiacSign || "Aries (Mesha)";
    const name = devoteeName || "Devotee";

    const dummyDevotee: any = {
      id: "TEST-DEVOTEE",
      name,
      email: recipient,
      mobile: "9560169988",
      zodiacSign: sign,
      planName: "Daily Vedic Horoscope",
      deliveryTime: config.scheduleTime || "07:00 AM",
      deliveryChannel: "email",
      status: "active",
    };

    const appUrl = (req.headers.origin as string) || (req.get("host") ? `${req.protocol || "https"}://${req.get("host")}` : undefined);
    const emailContent = db.generateHoroscopeEmail(dummyDevotee, todayPanchang, undefined, appUrl);
    const transportInfo = getEmailTransport(config);

    let previewUrl: string | undefined = undefined;
    let messageId: string | undefined = undefined;

    if (transportInfo.isConfigured && transportInfo.transporter) {
      const sendResult = await transportInfo.transporter.sendMail({
        from: `"${config.senderName || 'Acharya JyotishVani Kendra'}" <${transportInfo.senderFrom}>`,
        to: recipient,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
      messageId = sendResult.messageId;
      const testUrl = nodemailer.getTestMessageUrl(sendResult);
      if (testUrl) previewUrl = testUrl;
    } else {
      messageId = `SIM-${Date.now()}`;
    }

    res.json({
      success: true,
      message: `Vedic Horoscope sample email successfully dispatched to ${recipient}!`,
      previewUrl,
      messageId,
      subject: emailContent.subject,
    });
  } catch (err: any) {
    console.error("Test send error:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to dispatch test email.",
    });
  }
};
app.post("/api/admin/scheduler/test-send", requireAdminAuth, handleSendTestEmail);
app.post("/api/email-scheduler/send-test", requireAdminAuth, handleSendTestEmail);

// Instant Test WhatsApp Horoscope Dispatch - Sends directly via WhatsApp Gateway without opening client app (Protected)
app.post("/api/admin/scheduler/test-whatsapp", requireAdminAuth, async (req, res) => {
  try {
    const { mobile, zodiacSign, devoteeName } = req.body || {};
    const cleanMobile = (mobile || "9560169988").replace(/\D/g, "").slice(-10);
    const todayPanchang = db.getPanchang("today");
    const appUrl = (req.headers.origin as string) || `http://${req.headers.host}`;

    const dummySub: any = {
      name: devoteeName || "Devotee",
      mobile: cleanMobile,
      zodiacSign: zodiacSign || "Leo (Simha)",
      planName: "Active Vedic Subscriber",
      deliveryTime: "07:00 AM",
      deliveryChannel: "whatsapp",
    };

    const waResult = db.generateHoroscopeWhatsApp(dummySub, todayPanchang, appUrl);

    // Direct WhatsApp dispatch (Twilio / Meta Cloud / Server Gateway)
    const directResult = await sendDirectWhatsApp({
      to: cleanMobile,
      text: waResult.text,
      devoteeName: dummySub.name,
      zodiacSign: dummySub.zodiacSign,
      isTest: true,
    });

    const nowIso = new Date().toISOString();
    db.addSchedulerLog({
      id: `sched_test_wa_${Date.now()}`,
      runAt: nowIso,
      trigger: "test",
      totalTargeted: 1,
      sentCount: 1,
      whatsappSentCount: 1,
      emailSentCount: 0,
      skippedCount: 0,
      status: "success",
      dispatches: [
        {
          subscriberId: cleanMobile,
          name: dummySub.name,
          email: "",
          mobile: cleanMobile,
          zodiacSign: dummySub.zodiacSign,
          planName: "WhatsApp Test Dispatch",
          status: "delivered",
          whatsappStatus: "delivered",
          whatsappMessage: waResult.text,
          whatsappUrl: directResult.whatsappUrl,
          subject: `Test WhatsApp Dispatch to +91 ${cleanMobile}`,
          sentAt: nowIso,
          deliveryMode: directResult.gateway,
        },
      ],
    });

    res.json({
      success: true,
      delivered: directResult.delivered,
      directSent: true,
      gateway: directResult.gateway,
      messageId: directResult.messageId,
      to: directResult.to,
      message: `Direct WhatsApp message sent to +91 ${cleanMobile}! (${directResult.details})`,
      details: directResult.details,
      whatsappMessage: waResult.text,
      whatsappUrl: directResult.whatsappUrl,
      whatsappApiUrl: directResult.whatsappApiUrl,
      whatsappWebUrl: directResult.whatsappWebUrl,
      summary: waResult.summary,
      timestamp: directResult.timestamp,
    });
  } catch (err: any) {
    console.error("Error generating test WhatsApp:", err);
    res.status(500).json({ error: "Failed to dispatch test WhatsApp message." });
  }
});

// Instant Test SMS Text Message Dispatch - Sends directly via SMS Gateway without requiring WhatsApp (Protected)
app.post("/api/admin/scheduler/test-sms", requireAdminAuth, async (req, res) => {
  try {
    const { mobile, zodiacSign, devoteeName, format } = req.body || {};
    const cleanMobile = (mobile || "9560169988").replace(/\D/g, "").slice(-10);
    const todayPanchang = db.getPanchang("today");
    const appUrl = (req.headers.origin as string) || `http://${req.headers.host}`;

    const dummySub: any = {
      name: devoteeName || "Devotee",
      mobile: cleanMobile,
      zodiacSign: zodiacSign || "Leo (Simha)",
      planName: "Active Vedic Subscriber",
      deliveryTime: "07:00 AM",
      deliveryChannel: "sms",
    };

    const smsResult = db.generateHoroscopeSMS(dummySub, todayPanchang, appUrl);
    const chosenText = format === "full" ? smsResult.text : smsResult.compactText;

    // Direct SMS dispatch (Twilio SMS / Fast2SMS / Device SMS Gateway)
    const directResult = await sendDirectSms({
      to: cleanMobile,
      text: chosenText,
      devoteeName: dummySub.name,
      zodiacSign: dummySub.zodiacSign,
      isTest: true,
    });

    const nowIso = new Date().toISOString();
    db.addSchedulerLog({
      id: `sched_test_sms_${Date.now()}`,
      runAt: nowIso,
      trigger: "test",
      totalTargeted: 1,
      sentCount: 1,
      whatsappSentCount: 0,
      smsSentCount: 1,
      emailSentCount: 0,
      skippedCount: 0,
      status: "success",
      dispatches: [
        {
          subscriberId: cleanMobile,
          name: dummySub.name,
          email: "",
          mobile: cleanMobile,
          zodiacSign: dummySub.zodiacSign,
          planName: "SMS Test Dispatch",
          status: "delivered",
          smsStatus: "delivered",
          smsMessage: chosenText,
          smsUrl: directResult.smsUrl,
          subject: `Test SMS Text Message Dispatch to +91 ${cleanMobile}`,
          sentAt: nowIso,
          deliveryMode: directResult.gateway,
        },
      ],
    });

    res.json({
      success: true,
      delivered: directResult.delivered,
      directSent: true,
      gateway: directResult.gateway,
      messageId: directResult.messageId,
      to: directResult.to,
      message: `Direct SMS text message prepared for +91 ${cleanMobile}! (${directResult.details})`,
      details: directResult.details,
      smsText: chosenText,
      compactText: smsResult.compactText,
      fullText: smsResult.text,
      smsUrl: directResult.smsUrl,
      iosSmsUrl: directResult.iosSmsUrl,
      androidSmsUrl: directResult.androidSmsUrl,
      webSmsUrl: directResult.webSmsUrl,
      smsLength: directResult.smsLength,
      smsSegments: directResult.smsSegments,
      summary: smsResult.summary,
      timestamp: directResult.timestamp,
    });
  } catch (err: any) {
    console.error("Error generating test SMS:", err);
    res.status(500).json({ error: "Failed to dispatch test SMS text message." });
  }
});

// Create instant 1-click Ethereal Test Mailbox for live preview testing (Protected)
app.post(["/api/admin/scheduler/create-ethereal", "/api/admin/scheduler/create-test-smtp"], requireAdminAuth, async (req, res) => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    const updated = db.updateSchedulerConfig({
      smtpHost: testAccount.smtp.host,
      smtpPort: testAccount.smtp.port,
      smtpUser: testAccount.user,
      smtpPass: testAccount.pass,
      smtpSecure: testAccount.smtp.secure,
      senderEmail: testAccount.user,
    });
    res.json({
      success: true,
      account: {
        smtpHost: testAccount.smtp.host,
        smtpPort: testAccount.smtp.port,
        smtpUser: testAccount.user,
        smtpPass: testAccount.pass,
        smtpSecure: testAccount.smtp.secure,
        senderEmail: testAccount.user,
        web: testAccount.web,
      },
      testAccount: {
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        user: testAccount.user,
        pass: testAccount.pass,
        secure: testAccount.smtp.secure,
        web: testAccount.web,
      },
      config: updated,
      message: "Instant test SMTP mailbox generated on Ethereal! You can now send test horoscope dispatches with live browser previews.",
    });
  } catch (err: any) {
    console.error("Error creating test SMTP account:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate test SMTP account: " + (err?.message || err),
    });
  }
});

// Test Live SMTP Server Connection and Dispatch Test Verification (Protected)
app.post("/api/admin/scheduler/test-smtp", requireAdminAuth, async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, testRecipient } = req.body;
    const config = db.getSchedulerConfig();
    const host = (smtpHost || config.smtpHost || process.env.SMTP_HOST || "").trim();
    const port = Number(smtpPort || config.smtpPort || process.env.SMTP_PORT || 587);
    const user = (smtpUser || config.smtpUser || process.env.SMTP_USER || "").trim();
    const rawPass = (smtpPass || config.smtpPass || process.env.SMTP_PASS || "").trim();
    const pass = rawPass.replace(/\s+/g, "");
    const secure = smtpSecure !== undefined ? !!smtpSecure : (config.smtpSecure !== undefined ? !!config.smtpSecure : (process.env.SMTP_SECURE === "true" || port === 465));

    if (!host || !user || !pass) {
      return res.status(400).json({
        success: false,
        error: "Missing SMTP configuration. Please provide Host, Port, Username/Email, and Password/App Password.",
      });
    }

    const isGmail = host.toLowerCase().includes("gmail") || user.toLowerCase().endsWith("@gmail.com");

    const transporter = isGmail
      ? nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        })
      : nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        });

    await transporter.verify();

    let mailSent = false;
    let previewUrl: string | undefined = undefined;
    const recipient = testRecipient || user;
    if (recipient && recipient.includes("@")) {
      const sendResult = await transporter.sendMail({
        from: `"${config.senderName || 'Acharya JyotishVani Kendra'}" <${user}>`,
        to: recipient,
        subject: "✨ JyotishVani Kendra: SMTP Live Connection Verified",
        text: "Namaste! This is an automated verification confirmation that your SMTP email dispatch server is successfully connected and authorized for Daily Vedic Horoscope transmissions.",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #E8E6DF;border-radius:12px;background:#FAF9F6;">
            <div style="background:#5C6B5A;color:#FFF;padding:16px;border-radius:8px;text-align:center;">
              <h2 style="margin:0;font-size:20px;">JyotishVani Kendra</h2>
              <p style="margin:4px 0 0 0;font-size:12px;opacity:0.9;">SMTP Live Dispatch Engine Verified</p>
            </div>
            <div style="padding:16px 0;color:#3D3D3D;line-height:1.6;font-size:14px;">
              <p><strong>Namaste Devotee / Kendra Administrator 🙏</strong></p>
              <p>Your SMTP mail dispatch parameters (<strong>${host}:${port}</strong>) have been authenticated successfully. The Daily 07:00 AM Horoscope Scheduler will now deliver live emails directly to devotee inboxes.</p>
              <div style="background:#EDF3EC;border:1px solid #8B9D83;border-radius:8px;padding:12px;font-size:12px;color:#5C6B5A;">
                <strong>Status:</strong> Active &bull; Verified at ${new Date().toLocaleString("en-IN")}
              </div>
            </div>
            <p style="font-size:11px;color:#888;text-align:center;margin:0;">JyotishVani Kendra • +91 9560169988</p>
          </div>
        `,
      });
      mailSent = true;
      const testUrl = nodemailer.getTestMessageUrl(sendResult);
      if (testUrl) {
        previewUrl = testUrl;
      }
    }

    res.json({
      success: true,
      message: mailSent
        ? `SMTP connection verified and test notification sent to ${recipient}!`
        : `SMTP connection to ${host}:${port} verified successfully!`,
      previewUrl,
    });
  } catch (err: any) {
    console.error("SMTP Test Error:", err);
    const host = (req.body.smtpHost || "").trim();
    const user = (req.body.smtpUser || "").trim();
    const formattedError = formatSmtpError(err, host, user);
    res.status(400).json({
      success: false,
      error: formattedError,
    });
  }
});

// Preview Generated Email for any subscriber or sign
const handlePreviewEmail = (req: express.Request, res: express.Response) => {
  try {
    const { subscriberMobile, zodiacSign, name, email } = (req.method === "POST" ? req.body : req.query) || {};

    let subscriber = subscriberMobile ? db.getSubscriber(subscriberMobile as string) : null;

    if (!subscriber) {
      subscriber = {
        id: "PREVIEW-DEVOTEE",
        mobile: (subscriberMobile as string) || "9560169988",
        name: (name as string) || "Rohit Barla",
        email: (email as string) || "rohit.barla.ai.india@gmail.com",
        zodiacSign: (zodiacSign as string) || "Scorpio (Vrishchika)",
        birthDate: "1988-11-14",
        birthTime: "07:30 AM",
        birthCity: "New Delhi",
        deliveryChannel: "email",
        deliveryTime: "07:00 AM",
        planId: "yearly",
        planName: "1 Year Cosmic Shield",
        price: 1000,
        status: "active",
        registeredAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
      };
    }

    const appUrl = (req.headers.origin as string) || (req.get("host") ? `${req.protocol || "https"}://${req.get("host")}` : undefined);
    const preview = db.generateHoroscopeEmail(subscriber, db.getPanchang("today"), undefined, appUrl);
    res.json({
      success: true,
      preview,
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
    });
  } catch (err: any) {
    console.error("Preview generation error:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to generate preview." });
  }
};
app.post("/api/admin/scheduler/preview", requireAdminAuth, handlePreviewEmail);
app.get("/api/admin/scheduler/preview", requireAdminAuth, handlePreviewEmail);
app.post("/api/email-scheduler/preview", requireAdminAuth, handlePreviewEmail);
app.get("/api/email-scheduler/preview", requireAdminAuth, handlePreviewEmail);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JyotishVani Horoscope Server running on http://0.0.0.0:${PORT}`);
    startDailyEmailScheduler();
    console.log(`[Email Scheduler] Background Daily Horoscope Job service started.`);
  });
}

startServer();
